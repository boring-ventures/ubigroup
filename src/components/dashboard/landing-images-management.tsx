"use client";

import { useState, useCallback } from "react";
import {
  useLandingImages,
  type LandingImage,
} from "@/hooks/use-landing-images";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { uploadLandingImage } from "@/lib/supabase/upload-landing-image";
import { useCurrentUser } from "@/hooks/use-current-user";

export function LandingImagesManagement() {
  const { profile: user } = useCurrentUser();
  const {
    landingImages,
    loading,
    error,
    createLandingImage,
    updateLandingImage,
    deleteLandingImage,
    toggleImageStatus,
  } = useLandingImages();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<LandingImage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "INACTIVE" as "ACTIVE" | "INACTIVE",
  });

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    []
  );

  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      description: "",
      status: "INACTIVE",
    });
    setSelectedFile(null);
    setImagePreview(null);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!selectedFile || !user) {
      toast({
        title: "Error",
        description: "Por favor selecciona una imagen",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setIsConverting(true);

      // Upload image (this will automatically convert to WebP)
      const imageUrl = await uploadLandingImage(selectedFile);

      setIsConverting(false);

      // Create landing image record
      await createLandingImage({
        title: formData.title,
        description: formData.description,
        imageUrl,
        status: formData.status,
      });

      toast({
        title: "Éxito",
        description: "Imagen creada correctamente",
      });

      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating landing image:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al crear la imagen",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsConverting(false);
    }
  }, [selectedFile, user, formData, createLandingImage, resetForm]);

  const handleEdit = useCallback(async () => {
    if (!editingImage) return;

    try {
      setIsSubmitting(true);

      const updateData: {
        title: string;
        description: string;
        status: "ACTIVE" | "INACTIVE";
        imageUrl?: string;
      } = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
      };

      // If a new file is selected, upload it first (this will automatically convert to WebP)
      if (selectedFile) {
        setIsConverting(true);
        const imageUrl = await uploadLandingImage(selectedFile);
        setIsConverting(false);
        updateData.imageUrl = imageUrl;
      }

      await updateLandingImage(editingImage.id, updateData);

      toast({
        title: "Éxito",
        description: "Imagen actualizada correctamente",
      });

      setIsEditDialogOpen(false);
      setEditingImage(null);
      resetForm();
    } catch (error) {
      console.error("Error updating landing image:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al actualizar la imagen",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsConverting(false);
    }
  }, [editingImage, formData, selectedFile, updateLandingImage, resetForm]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("¿Estás seguro de que quieres eliminar esta imagen?"))
        return;

      try {
        console.log("Deleting image with ID:", id);
        await deleteLandingImage(id);
        console.log("Image deleted successfully");
        toast({
          title: "Éxito",
          description: "Imagen eliminada correctamente",
        });
      } catch (error) {
        console.error("Error deleting landing image:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Error al eliminar la imagen",
          variant: "destructive",
        });
      }
    },
    [deleteLandingImage]
  );

  const handleToggleStatus = useCallback(
    async (id: string) => {
      try {
        await toggleImageStatus(id);
        toast({
          title: "Éxito",
          description: "Estado de la imagen actualizado",
        });
      } catch (error) {
        console.error("Error toggling image status:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Error al cambiar el estado",
          variant: "destructive",
        });
      }
    },
    [toggleImageStatus]
  );

  const openEditDialog = useCallback((image: LandingImage) => {
    setEditingImage(image);
    setFormData({
      title: image.title || "",
      description: image.description || "",
      status: image.status,
    });
    setImagePreview(image.imageUrl);
    setIsEditDialogOpen(true);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div>Cargando imágenes...</div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Imágenes del Hero</h2>
          <p className="text-muted-foreground">
            {landingImages.length} imagen
            {landingImages.length !== 1 ? "es" : ""} total
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Imagen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar Nueva Imagen</DialogTitle>
              <DialogDescription>
                Sube una nueva imagen para la sección hero de la página
                principal.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="image">Imagen</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  required
                />
                {imagePreview && (
                  <div className="mt-2">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      width={400}
                      height={128}
                      className="w-full h-32 object-cover rounded"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Título de la imagen"
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descripción opcional"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "ACTIVE" | "INACTIVE") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Activo</SelectItem>
                    <SelectItem value="INACTIVE">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={isSubmitting}>
                {isConverting
                  ? "Convirtiendo..."
                  : isSubmitting
                    ? "Creando..."
                    : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {landingImages.map((image) => (
          <Card key={image.id} className="overflow-hidden">
            <div className="aspect-video relative">
              <Image
                src={image.imageUrl}
                alt={image.title || "Hero image"}
                width={400}
                height={225}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-1">
                <Badge
                  variant={image.status === "ACTIVE" ? "default" : "secondary"}
                >
                  {image.status === "ACTIVE" ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>

            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {image.title || "Sin título"}
              </CardTitle>
              {image.description && (
                <p className="text-sm text-muted-foreground">
                  {image.description}
                </p>
              )}
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Estado: {image.status === "ACTIVE" ? "Activo" : "Inactivo"}
                </div>

                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(image.id)}
                  >
                    {image.status === "ACTIVE" ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(image)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(image.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Imagen</DialogTitle>
            <DialogDescription>
              Modifica los detalles de la imagen del hero.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-image">Imagen</Label>
              <Input
                id="edit-image"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
              />
              {imagePreview && (
                <div className="mt-2">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={400}
                    height={128}
                    className="w-full h-32 object-cover rounded"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="edit-title">Título</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Título de la imagen"
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descripción opcional"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "ACTIVE" | "INACTIVE") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Activo</SelectItem>
                  <SelectItem value="INACTIVE">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isConverting
                ? "Convirtiendo..."
                : isSubmitting
                  ? "Actualizando..."
                  : "Actualizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
