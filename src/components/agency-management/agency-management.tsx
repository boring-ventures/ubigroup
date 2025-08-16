"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Search,
  Edit,
  Eye,
  EyeOff,
  Building2,
  Phone,
  Users,
  Trash2,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  createAgencySchema,
  CreateAgencyInput,
} from "@/lib/validations/agency";

// Types
interface Agency {
  id: string;
  name: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  active: boolean;
  createdAt: string;
  _count?: {
    users: number;
    properties: number;
  };
}

type CreateAgencyFormData = CreateAgencyInput;

interface AgencyManagementProps {
  onAgencyUpdate?: () => void;
}

export function AgencyManagement({ onAgencyUpdate }: AgencyManagementProps) {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingAgency, setDeletingAgency] = useState<Agency | null>(null);

  const form = useForm<CreateAgencyFormData>({
    resolver: zodResolver(createAgencySchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
    },
  });

  const editForm = useForm<CreateAgencyFormData>({
    resolver: zodResolver(createAgencySchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
    },
  });

  // Fetch agencies
  const fetchAgencies = async () => {
    try {
      const response = await fetch("/api/agencies");
      if (response.ok) {
        const data = await response.json();
        setAgencies(data.agencies || []);
      }
    } catch (error) {
      console.error("Failed to fetch agencies:", error);
      toast({
        title: "Error",
        description: "Error al cargar las agencias",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchAgencies();
      setLoading(false);
    };
    loadData();
  }, []);

  // Create agency
  const onSubmit = async (data: CreateAgencyFormData) => {
    try {
      setIsCreating(true);

      const requestData = {
        name: data.name,
        address: data.address?.trim() || null,
        phone: data.phone?.trim() || null,
      };

      console.log("Submitting agency data:", requestData);

      const response = await fetch("/api/agencies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log("Success response:", result);
        toast({
          title: "Éxito",
          description: "Agencia creada exitosamente",
        });
        setIsCreateDialogOpen(false);
        form.reset();
        fetchAgencies();
        onAgencyUpdate?.();
      } else {
        const error = await response.json();
        console.log("Error response:", error);
        throw new Error(
          error.error || error.message || "Error al crear la agencia"
        );
      }
    } catch (error) {
      console.error("Failed to create agency:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al crear la agencia",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Edit agency
  const handleEditAgency = (agency: Agency) => {
    setEditingAgency(agency);
    editForm.reset({
      name: agency.name,
      address: agency.address || "",
      phone: agency.phone || "",
    });
    setIsEditDialogOpen(true);
  };

  const onEditSubmit = async (data: CreateAgencyFormData) => {
    if (!editingAgency) return;

    try {
      setIsEditing(true);

      const response = await fetch(`/api/agencies/${editingAgency.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          address: data.address?.trim() || null,
          phone: data.phone?.trim() || null,
        }),
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Agencia actualizada exitosamente",
        });
        setIsEditDialogOpen(false);
        setEditingAgency(null);
        editForm.reset();
        fetchAgencies();
        onAgencyUpdate?.();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Error al actualizar la agencia");
      }
    } catch (error) {
      console.error("Failed to update agency:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al actualizar la agencia",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  // Toggle agency status
  const toggleAgencyStatus = async (
    agencyId: string,
    currentStatus: boolean
  ) => {
    try {
      const response = await fetch(`/api/agencies/${agencyId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active: !currentStatus }),
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: `Agencia ${!currentStatus ? "activada" : "desactivada"} exitosamente`,
        });
        fetchAgencies();
        onAgencyUpdate?.();
      } else {
        throw new Error("Error al actualizar el estado de la agencia");
      }
    } catch (error) {
      console.error("Failed to toggle agency status:", error);
      toast({
        title: "Error",
        description: "Error al actualizar el estado de la agencia",
        variant: "destructive",
      });
    }
  };

  // Delete agency
  const handleDeleteAgency = (agency: Agency) => {
    setDeletingAgency(agency);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteAgency = async () => {
    if (!deletingAgency) return;

    try {
      setIsDeleting(true);

      const response = await fetch(`/api/agencies/${deletingAgency.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: `Agencia "${deletingAgency.name}" eliminada exitosamente`,
        });
        setIsDeleteDialogOpen(false);
        setDeletingAgency(null);
        fetchAgencies();
        onAgencyUpdate?.();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar la agencia");
      }
    } catch (error) {
      console.error("Failed to delete agency:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al eliminar la agencia",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter agencies
  const filteredAgencies = agencies.filter(
    (agency) =>
      agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agency.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center p-8">Cargando agencias...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Agencias del Sistema</CardTitle>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Agencia
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Agencia</DialogTitle>
                  <DialogDescription>
                    Crear una nueva agencia inmobiliaria en el sistema.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de la Agencia</FormLabel>
                          <FormControl>
                            <Input placeholder="ABC Bienes Raíces" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección (Opcional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="123 Calle Principal, Ciudad, Estado"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono (Opcional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="12345678"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="submit" disabled={isCreating}>
                        {isCreating ? "Creando..." : "Crear Agencia"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Edit Agency Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Editar Agencia</DialogTitle>
                  <DialogDescription>
                    Actualizar información de la agencia y detalles de contacto.
                  </DialogDescription>
                </DialogHeader>
                <Form {...editForm}>
                  <form
                    onSubmit={editForm.handleSubmit(onEditSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={editForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de la Agencia</FormLabel>
                          <FormControl>
                            <Input placeholder="ABC Bienes Raíces" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección (Opcional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="123 Calle Principal, Ciudad, Estado"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono (Opcional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="12345678"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="submit" disabled={isEditing}>
                        {isEditing ? "Actualizando..." : "Actualizar Agencia"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Delete Agency Dialog */}
            <Dialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Eliminar Agencia</DialogTitle>
                  <DialogDescription asChild>
                    <div className="space-y-3">
                      <div>
                        ¿Estás seguro de que quieres eliminar{" "}
                        <span className="font-semibold">
                          {deletingAgency?.name}
                        </span>
                        ?
                      </div>
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-2">
                        <div className="text-sm font-medium text-destructive">
                          ⚠️ Esto eliminará permanentemente:
                        </div>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• La agencia y todos sus datos</li>
                          <li>
                            • Todos los usuarios (agentes, administradores)
                            asociados con esta agencia
                          </li>
                          <li>
                            • Todas las propiedades listadas por esta agencia
                          </li>
                          <li>
                            • Todas las imágenes de propiedades del
                            almacenamiento
                          </li>
                        </ul>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Esta acción no se puede deshacer. Por favor, asegúrate
                        de haber respaldado cualquier dato importante.
                      </div>
                    </div>
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDeleteDialogOpen(false);
                      setDeletingAgency(null);
                    }}
                    disabled={isDeleting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmDeleteAgency}
                    disabled={isDeleting}
                  >
                    {isDeleting
                      ? "Eliminando..."
                      : "Eliminar Agencia y Todos los Datos"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar agencias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Agencies Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agencia</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Usuarios</TableHead>
                  <TableHead>Propiedades</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgencies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No se encontraron agencias
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAgencies.map((agency) => (
                    <TableRow key={agency.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={agency.logoUrl || undefined} />
                            <AvatarFallback>
                              <Building2 className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{agency.name}</div>
                            {agency.address && (
                              <div className="text-sm text-muted-foreground">
                                {agency.address}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {agency.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3" />
                              {agency.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {agency._count?.users || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {agency._count?.properties || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={agency.active ? "default" : "secondary"}
                        >
                          {agency.active ? "Activa" : "Inactiva"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(agency.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleAgencyStatus(agency.id, agency.active)
                            }
                            title={
                              agency.active
                                ? "Desactivar agencia"
                                : "Activar agencia"
                            }
                          >
                            {agency.active ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAgency(agency)}
                            title="Editar agencia"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAgency(agency)}
                            title="Eliminar agencia"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
