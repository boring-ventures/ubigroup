"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NumericInput } from "@/components/ui/numeric-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import {
  createProjectSchema,
  type CreateProjectInput,
} from "@/lib/validations/project";

import {
  Building2,
  MapPin,
  Image as ImageIcon,
  X,
  Plus,
  Loader,
  FileText,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { uploadFiles, validateFile, MAX_TOTAL_SIZE } from "@/lib/upload";

interface ProjectFormProps {
  initialData?: Partial<CreateProjectInput> & {
    status?: "PENDING" | "APPROVED" | "REJECTED";
    rejectionMessage?: string | null;
  };
  projectId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProjectForm({
  initialData,
  projectId,
  onSuccess,
  onCancel,
}: ProjectFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>(
    initialData?.images || []
  );
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [uploadedBrochureUrl, setUploadedBrochureUrl] = useState<string | null>(
    initialData?.brochureUrl || null
  );

  // Update brochure state when initialData changes (for edit mode)
  React.useEffect(() => {
    console.log("ProjectForm initialData:", initialData);
    console.log("Initial brochure URL:", initialData?.brochureUrl);
    if (initialData?.brochureUrl) {
      setUploadedBrochureUrl(initialData.brochureUrl);
    }
  }, [initialData]);
  const router = useRouter();

  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      location: initialData?.location || "",

      images: initialData?.images || [],
      brochureUrl: initialData?.brochureUrl || "",
      googleMapsUrl: initialData?.googleMapsUrl || "",
      latitude: initialData?.latitude || undefined,
      longitude: initialData?.longitude || undefined,
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter((file) => validateFile(file, "image"));

    if (validFiles.length !== files.length) {
      toast({
        title: "Tipo de archivo no válido",
        description:
          "Por favor sube solo archivos de imagen (JPG, PNG, GIF, WebP)",
        variant: "destructive",
      });
    }

    // Calculate total size of new files
    const newFilesSize = validFiles.reduce(
      (total, file) => total + file.size,
      0
    );

    // Calculate total size of existing files
    const existingFilesSize = images.reduce(
      (total, file) => total + file.size,
      0
    );

    // Check if total size would exceed the batch limit
    const totalSize = existingFilesSize + newFilesSize;
    if (totalSize > MAX_TOTAL_SIZE) {
      const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
      const limitMB = (MAX_TOTAL_SIZE / (1024 * 1024)).toFixed(0);
      toast({
        title: "Tamaño total demasiado grande",
        description: `El tamaño total de las imágenes (${totalSizeMB}MB) excede el límite de ${limitMB}MB. Por favor, selecciona menos imágenes o imágenes más pequeñas.`,
        variant: "destructive",
      });
      return;
    }

    setImages((prev) => [...prev, ...validFiles]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBrochureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && validateFile(file, "document")) {
      setBrochureFile(file);
      // Clear any existing uploaded brochure when a new one is selected
      setUploadedBrochureUrl(null);
      // Clear the form field as well
      form.setValue("brochureUrl", "");
    }
  };

  const removeBrochureFile = () => {
    setBrochureFile(null);
  };

  const removeUploadedBrochure = () => {
    setUploadedBrochureUrl(null);
    form.setValue("brochureUrl", "");
  };

  const onSubmit = async (data: CreateProjectInput) => {
    try {
      setIsSubmitting(true);

      // Upload new images
      let newImageUrls: string[] = [];
      if (images.length > 0) {
        newImageUrls = await uploadFiles(images, "images");
      }

      // Upload new brochure
      let newBrochureUrl: string | null = uploadedBrochureUrl;
      if (brochureFile) {
        const brochureUrls = await uploadFiles([brochureFile], "documents");
        newBrochureUrl = brochureUrls[0] || null;
      }

      // Combine uploaded images with existing ones
      const allImages = [...uploadedImages, ...newImageUrls];

      const projectData = {
        ...data,
        images: allImages,
        brochureUrl:
          newBrochureUrl ||
          (data.brochureUrl && data.brochureUrl.trim() !== ""
            ? data.brochureUrl
            : undefined),
        googleMapsUrl:
          data.googleMapsUrl && data.googleMapsUrl.trim() !== ""
            ? data.googleMapsUrl
            : undefined,
        latitude: data.latitude || undefined,
        longitude: data.longitude || undefined,
      };

      const url = projectId ? `/api/projects/${projectId}` : "/api/projects";
      const method = projectId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "No se pudo guardar el proyecto");
      }

      await response.json();

      toast({
        title: "Éxito",
        description: projectId
          ? "Proyecto actualizado correctamente"
          : "Proyecto creado correctamente",
      });

      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to the project detail page or projects list
        if (projectId) {
          router.push(`/projects/${projectId}`);
        } else {
          router.push("/projects");
        }
      }
    } catch (error) {
      console.error("Error al guardar el proyecto:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el proyecto",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="mr-2 h-5 w-5" />
            {projectId ? "Editar proyecto" : "Crear nuevo proyecto"}
          </CardTitle>
          <CardDescription>
            {projectId
              ? "Actualiza la información de tu proyecto"
              : "Completa los detalles para crear un nuevo proyecto"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {initialData?.status === "REJECTED" &&
            initialData?.rejectionMessage && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  <strong>Proyecto rechazado:</strong>{" "}
                  {initialData.rejectionMessage}
                </AlertDescription>
              </Alert>
            )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del proyecto</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ingresa el nombre del proyecto"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <MapPin className="mr-1 h-4 w-4" />
                      Dirección
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ingresa la dirección del proyecto"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="googleMapsUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Maps URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://maps.google.com/..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Opcional: enlace de Google Maps del proyecto
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitud</FormLabel>
                      <FormControl>
                        <NumericInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="-40.7128"
                          step={0.000001}
                          aria-label="Coordenada de latitud del proyecto"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitud</FormLabel>
                      <FormControl>
                        <NumericInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="-74.0060"
                          step={0.000001}
                          aria-label="Coordenada de longitud del proyecto"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe tu proyecto..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Proporciona una descripción detallada de tu proyecto
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div>
                  <Label className="flex items-center">
                    <ImageIcon className="mr-1 h-4 w-4" />
                    Imágenes del proyecto
                  </Label>
                  <div className="mt-2">
                    <Input
                      type="file"
                      accept="image/*,.webp"
                      multiple
                      onChange={handleImageUpload}
                      className="cursor-pointer"
                    />
                    {images.length > 0 && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        Tamaño total:{" "}
                        {(
                          images.reduce((total, file) => total + file.size, 0) /
                          (1024 * 1024)
                        ).toFixed(2)}
                        MB de {(MAX_TOTAL_SIZE / (1024 * 1024)).toFixed(0)}MB
                        máximo
                      </div>
                    )}
                  </div>
                </div>

                {/* Display uploaded images */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {uploadedImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={imageUrl}
                          alt={`Imagen del proyecto ${index + 1}`}
                          width={200}
                          height={150}
                          className="rounded-lg object-cover w-full h-32"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeUploadedImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Display new images */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((file, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={URL.createObjectURL(file)}
                          alt={`New image ${index + 1}`}
                          width={200}
                          height={150}
                          className="rounded-lg object-cover w-full h-32"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Brochure Upload Section */}
              <div className="space-y-4">
                <div>
                  <Label className="flex items-center">
                    <FileText className="mr-1 h-4 w-4" />
                    Brochure del proyecto (PDF)
                  </Label>
                  <div className="mt-2">
                    <Input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleBrochureUpload}
                      className="cursor-pointer"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Opcional: Sube un brochure en formato PDF del proyecto
                    </p>
                  </div>
                </div>

                {/* Display uploaded brochure */}
                {uploadedBrochureUrl && (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        Brochure actual
                      </span>
                      <a
                        href={uploadedBrochureUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Ver PDF
                      </a>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={removeUploadedBrochure}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {/* Display new brochure file */}
                {brochureFile && (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {brochureFile.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({(brochureFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={removeBrochureFile}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancelar
                  </Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      {projectId ? "Actualizar proyecto" : "Crear proyecto"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
