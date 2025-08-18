"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Search,
  Edit,
  Trash2,
  Phone,
  Shield,
  Users,
  Settings,
  UserPlus,
  Building2,
  Key,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { PasswordInput } from "@/components/utils/password-input";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  generateSecurePassword,
  formatPhoneNumber,
  removePhonePrefix,
} from "@/lib/utils";
import { CredentialsModal } from "./credentials-modal";

// Types
interface User {
  id: string;
  userId: string;
  email: string; // Email from Supabase Auth
  firstName: string | null;
  lastName: string | null;
  role: "SUPER_ADMIN" | "AGENCY_ADMIN" | "AGENT";
  phone: string | null;
  avatarUrl: string | null;
  active: boolean;
  createdAt: string;
  agencyId: string | null;
  agency?: {
    id: string;
    name: string;
  } | null;
}

interface Agency {
  id: string;
  name: string;
  active: boolean;
}

// Form schemas
const createUserSchema = z.object({
  email: z.string().email("Dirección de correo electrónico inválida"),
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  role: z.enum(["SUPER_ADMIN", "AGENCY_ADMIN", "AGENT"]),
  phone: z
    .string()
    .refine((val) => {
      if (!val) return true; // Optional field
      const digits = val.replace(/\D/g, "");
      // Accept 8 digits (landline) or 9 digits (mobile) for Bolivia
      return digits.length >= 8 && digits.length <= 9;
    }, "El teléfono debe tener 8 dígitos (fijo) o 9 dígitos (móvil)")
    .optional(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  agencyId: z.string().optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface UserManagementProps {
  onUserUpdate?: () => void;
}

export function UserManagement({ onUserUpdate }: UserManagementProps) {
  const { profile: currentUser } = useCurrentUser();
  const [users, setUsers] = useState<User[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [createdUserCredentials, setCreatedUserCredentials] = useState<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    agencyName?: string;
  } | null>(null);
  const [isResetCredentialsModalOpen, setIsResetCredentialsModalOpen] =
    useState(false);
  const [resetUserCredentials, setResetUserCredentials] = useState<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    agencyName?: string;
  } | null>(null);

  // Delete confirmation modal state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userAssets, setUserAssets] = useState<{
    propertiesCount: number;
    projectsCount: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "AGENT",
      phone: "",
      password: "",
      agencyId: "",
    },
  });

  // Generate password function
  const handleGeneratePassword = () => {
    const generatedPassword = generateSecurePassword();
    form.setValue("password", generatedPassword);
  };

  // Generate password for reset
  const handleGenerateResetPassword = () => {
    const generatedPassword = generateSecurePassword();
    const passwordInput = document.querySelector(
      'input[name="newPassword"]'
    ) as HTMLInputElement;
    if (passwordInput) {
      passwordInput.value = generatedPassword;
    }
  };

  const editForm = useForm<Omit<CreateUserFormData, "email" | "password">>({
    resolver: zodResolver(
      createUserSchema.omit({ email: true, password: true })
    ),
    defaultValues: {
      firstName: "",
      lastName: "",
      role: "AGENT",
      phone: "",
      agencyId: "",
    },
  });

  const watchedRole = form.watch("role");
  const watchedEditRole = editForm.watch("role");

  // Get available roles based on current user's role
  const getAvailableRoles = () => {
    if (!currentUser) return [];

    switch (currentUser.role) {
      case "SUPER_ADMIN":
        return ["SUPER_ADMIN", "AGENCY_ADMIN", "AGENT"];
      case "AGENCY_ADMIN":
        return ["AGENCY_ADMIN", "AGENT"];
      default:
        return [];
    }
  };

  const availableRoles = getAvailableRoles();

  // Fetch users and agencies
  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({
        title: "Error",
        description: "Error al cargar usuarios",
        variant: "destructive",
      });
    }
  };

  const fetchAgencies = async () => {
    try {
      const response = await fetch("/api/agencies");
      if (response.ok) {
        const data = await response.json();
        setAgencies(data.agencies || []);
      }
    } catch (error) {
      console.error("Failed to fetch agencies:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchAgencies()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Create user
  const onSubmit = async (data: CreateUserFormData) => {
    try {
      setIsCreating(true);

      // Format phone number with Bolivia prefix if provided
      const formattedPhone = data.phone ? formatPhoneNumber(data.phone) : null;

      // Prepare user data - send raw password, API will handle auth creation
      const userData = {
        email: data.email,
        password: data.password, // Send raw password
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        phone: formattedPhone,
        agencyId:
          data.role === "SUPER_ADMIN"
            ? null
            : currentUser?.role === "AGENCY_ADMIN"
              ? currentUser.agencyId
              : data.agencyId || null,
      };

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.canLoginNow) {
          // User was created successfully in Supabase Auth
          // Show credentials modal
          const selectedAgency = agencies.find(
            (agency) => agency.id === userData.agencyId
          );
          setCreatedUserCredentials({
            email: data.email,
            password: data.password,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role,
            agencyName: selectedAgency?.name,
          });
          setIsCredentialsModalOpen(true);
        } else if (result.requiresSignup) {
          // Fallback approach - user needs to complete signup
          toast({
            title: "⚠️ Perfil Creado - Registro Requerido",
            description: `Perfil creado. El usuario debe completar el registro en /sign-up con email: ${result.email} y contraseña: ${result.password}`,
          });
        } else {
          // Default success message
          toast({
            title: "Usuario Creado",
            description: result.message || "Usuario creado exitosamente.",
          });
        }

        setIsCreateDialogOpen(false);
        form.reset();
        fetchUsers();
        onUserUpdate?.();
      } else {
        throw new Error(result.error || "Error al crear usuario");
      }
    } catch (error) {
      console.error("Failed to create user:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al crear usuario",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Edit user
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    editForm.reset({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.role,
      phone: user.phone ? removePhonePrefix(user.phone) : "",
      agencyId: user.agencyId || "",
    });
    setIsEditDialogOpen(true);
  };

  const onEditSubmit = async (
    data: Omit<CreateUserFormData, "email" | "password">
  ) => {
    if (!editingUser) return;

    try {
      setIsEditing(true);

      // Format phone number with Bolivia prefix if provided
      const formattedPhone = data.phone ? formatPhoneNumber(data.phone) : null;

      const updateData = {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        phone: formattedPhone,
        agencyId:
          data.role === "SUPER_ADMIN"
            ? null
            : currentUser?.role === "AGENCY_ADMIN"
              ? currentUser.agencyId
              : data.agencyId || null,
      };

      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "✅ Usuario Actualizado",
          description:
            "La información del usuario ha sido actualizada exitosamente.",
        });
        setIsEditDialogOpen(false);
        setEditingUser(null);
        editForm.reset();
        fetchUsers();
        onUserUpdate?.();
      } else {
        throw new Error(result.error || "Error al actualizar usuario");
      }
    } catch (error) {
      console.error("Failed to update user:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al actualizar usuario",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  // Reset password
  const handleResetPassword = async (user: User) => {
    setPasswordUser(user);
    setIsPasswordDialogOpen(true);
  };

  const onResetPasswordSubmit = async (data: { newPassword: string }) => {
    if (!passwordUser) return;

    try {
      setIsResettingPassword(true);

      const response = await fetch(`/api/users/${passwordUser.id}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: data.newPassword }),
      });

      const result = await response.json();

      if (response.ok) {
        // Show credentials modal for password reset
        const selectedAgency = agencies.find(
          (agency) => agency.id === passwordUser.agencyId
        );

        // Debug: Log the values to understand what we're getting
        console.log("Password reset result:", result);
        console.log("Password user:", passwordUser);
        console.log(
          "Using email:",
          result.email || result.userId || passwordUser.userId
        );

        // Use the user data from the API response if available
        const userData = result.user || passwordUser;

        setResetUserCredentials({
          email: result.email || userData.userId, // Use email from API response or fallback to userId
          password: data.newPassword,
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          role: userData.role,
          agencyName: selectedAgency?.name,
        });
        setIsResetCredentialsModalOpen(true);
        setIsPasswordDialogOpen(false);
        setPasswordUser(null);
      } else {
        throw new Error(result.error || "Error al restablecer contraseña");
      }
    } catch (error) {
      console.error("Failed to reset password:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al restablecer contraseña",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Check user assets before deletion
  const checkUserAssets = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/assets`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return { propertiesCount: 0, projectsCount: 0 };
    } catch (error) {
      console.error("Failed to check user assets:", error);
      return { propertiesCount: 0, projectsCount: 0 };
    }
  };

  // Delete user
  const handleDeleteUser = async (user: User) => {
    // Check if user has properties or projects
    const assets = await checkUserAssets(user.id);

    if (assets.propertiesCount > 0 || assets.projectsCount > 0) {
      // User has assets, show confirmation modal
      setUserToDelete(user);
      setUserAssets(assets);
      setIsDeleteDialogOpen(true);
    } else {
      // User has no assets, proceed with simple confirmation
      if (
        window.confirm(
          `¿Estás seguro de que quieres eliminar al usuario ${user.firstName} ${user.lastName}?`
        )
      ) {
        await performUserDeletion(user);
      }
    }
  };

  // Perform the actual user deletion
  const performUserDeletion = async (user: User) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "✅ Usuario Eliminado",
          description: "El usuario ha sido eliminado exitosamente.",
        });
        fetchUsers();
        onUserUpdate?.();
      } else {
        throw new Error(result.error || "Error al eliminar usuario");
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al eliminar usuario",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      setUserAssets(null);
    }
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = selectedRole === "all" || user.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "destructive";
      case "AGENCY_ADMIN":
        return "default";
      case "AGENT":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return <Shield className="h-3 w-3" />;
      case "AGENCY_ADMIN":
        return <Settings className="h-3 w-3" />;
      case "AGENT":
        return <Users className="h-3 w-3" />;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Cargando usuarios...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Usuarios del Sistema</CardTitle>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Crear Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-[500px] sm:w-full">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                  <DialogDescription>
                    Crear una nueva cuenta de usuario con el rol y permisos
                    especificados.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                              <Input placeholder="Juan" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apellido</FormLabel>
                            <FormControl>
                              <Input placeholder="Pérez" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo Electrónico</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="usuario@ejemplo.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rol</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar rol" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableRoles.includes("SUPER_ADMIN") && (
                                <SelectItem value="SUPER_ADMIN">
                                  <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Super Administrador
                                  </div>
                                </SelectItem>
                              )}
                              {availableRoles.includes("AGENCY_ADMIN") && (
                                <SelectItem value="AGENCY_ADMIN">
                                  <div className="flex items-center gap-2">
                                    <Settings className="h-4 w-4" />
                                    Administrador de Agencia
                                  </div>
                                </SelectItem>
                              )}
                              {availableRoles.includes("AGENT") && (
                                <SelectItem value="AGENT">
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Agente
                                  </div>
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchedRole !== "SUPER_ADMIN" && (
                      <FormField
                        control={form.control}
                        name="agencyId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Agencia</FormLabel>
                            {currentUser?.role === "AGENCY_ADMIN" ? (
                              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
                                <Building2 className="h-4 w-4" />
                                <span className="text-sm">
                                  {currentUser.agencyId
                                    ? "Tu Agencia"
                                    : "Sin Agencia Asignada"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  (Asignado automáticamente)
                                </span>
                              </div>
                            ) : (
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar agencia" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {agencies.map((agency) => (
                                    <SelectItem
                                      key={agency.id}
                                      value={agency.id}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        {agency.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Teléfono (Opcional)</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <div className="flex items-center px-3 py-2 text-sm border border-r-0 rounded-l-md bg-muted text-muted-foreground">
                                +591
                              </div>
                              <Input
                                placeholder="71234567 o 21234567"
                                className="rounded-l-none"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            Ingresa solo el número sin el prefijo
                          </p>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contraseña</FormLabel>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <FormControl>
                              <PasswordInput
                                placeholder="********"
                                {...field}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleGeneratePassword}
                              className="flex-shrink-0"
                            >
                              <Key className="h-4 w-4 mr-1" />
                              Generar
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="submit" disabled={isCreating}>
                        {isCreating ? "Creando..." : "Crear Usuario"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="w-[95vw] max-w-[500px] sm:w-full">
                <DialogHeader>
                  <DialogTitle>Editar Usuario</DialogTitle>
                  <DialogDescription>
                    Actualizar la información del usuario y sus permisos.
                  </DialogDescription>
                </DialogHeader>
                <Form {...editForm}>
                  <form
                    onSubmit={editForm.handleSubmit(onEditSubmit)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={editForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                              <Input placeholder="Juan" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apellido</FormLabel>
                            <FormControl>
                              <Input placeholder="Pérez" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={editForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rol</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar rol" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableRoles.includes("SUPER_ADMIN") && (
                                <SelectItem value="SUPER_ADMIN">
                                  <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Super Administrador
                                  </div>
                                </SelectItem>
                              )}
                              {availableRoles.includes("AGENCY_ADMIN") && (
                                <SelectItem value="AGENCY_ADMIN">
                                  <div className="flex items-center gap-2">
                                    <Settings className="h-4 w-4" />
                                    Administrador de Agencia
                                  </div>
                                </SelectItem>
                              )}
                              {availableRoles.includes("AGENT") && (
                                <SelectItem value="AGENT">
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Agente
                                  </div>
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchedEditRole !== "SUPER_ADMIN" && (
                      <FormField
                        control={editForm.control}
                        name="agencyId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Agencia</FormLabel>
                            {currentUser?.role === "AGENCY_ADMIN" ? (
                              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
                                <Building2 className="h-4 w-4" />
                                <span className="text-sm">
                                  {currentUser.agencyId
                                    ? "Tu Agencia"
                                    : "Sin Agencia Asignada"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  (Asignado automáticamente)
                                </span>
                              </div>
                            ) : (
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar agencia" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {agencies.map((agency) => (
                                    <SelectItem
                                      key={agency.id}
                                      value={agency.id}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        <span className="text-sm">
                                          {agency.name}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={editForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono (Opcional)</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <div className="flex items-center px-3 py-2 text-sm border border-r-0 rounded-l-md bg-muted text-muted-foreground">
                                +591
                              </div>
                              <Input
                                placeholder="71234567 o 21234567"
                                className="rounded-l-none"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            Ingresa solo el número sin el prefijo
                          </p>
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="submit" disabled={isEditing}>
                        {isEditing ? "Actualizando..." : "Actualizar Usuario"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Password Reset Dialog */}
            <Dialog
              open={isPasswordDialogOpen}
              onOpenChange={setIsPasswordDialogOpen}
            >
              <DialogContent className="w-[95vw] max-w-[400px] sm:w-full">
                <DialogHeader>
                  <DialogTitle>Restablecer Contraseña</DialogTitle>
                  <DialogDescription>
                    Establecer una nueva contraseña para{" "}
                    <span className="font-semibold">
                      {passwordUser?.firstName} {passwordUser?.lastName}
                    </span>
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const newPassword = formData.get("newPassword") as string;
                    onResetPasswordSubmit({ newPassword });
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-sm font-medium">
                      Nueva Contraseña
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2 mt-1">
                      <PasswordInput
                        name="newPassword"
                        placeholder="Ingresa la nueva contraseña"
                        className="flex-1"
                        required
                        minLength={8}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGenerateResetPassword}
                        className="flex-shrink-0"
                      >
                        <Key className="h-4 w-4 mr-1" />
                        Generar
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      La contraseña debe tener al menos 8 caracteres
                    </p>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsPasswordDialogOpen(false)}
                      disabled={isResettingPassword}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isResettingPassword}>
                      {isResettingPassword
                        ? "Actualizando..."
                        : "Actualizar Contraseña"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col space-y-4 mb-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Roles</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Administrador</SelectItem>
                <SelectItem value="AGENCY_ADMIN">
                  Administrador de Agencia
                </SelectItem>
                <SelectItem value="AGENT">Agente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Agencia</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatarUrl || undefined} />
                              <AvatarFallback>
                                {user.firstName?.[0]}
                                {user.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getRoleBadgeVariant(user.role)}
                            className="gap-1"
                          >
                            {getRoleIcon(user.role)}
                            {user.role.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.agency ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {user.agency.name}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.phone ? (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              title="Editar usuario"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResetPassword(user)}
                              title="Restablecer contraseña"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                              title="Eliminar usuario"
                              className="text-red-600 hover:text-red-700"
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

            {/* Mobile Cards */}
            <div className="md:hidden">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron usuarios
                </div>
              ) : (
                <div className="space-y-4 p-4">
                  {filteredUsers.map((user) => (
                    <Card key={user.id} className="p-4">
                      <div className="flex flex-col space-y-3 mb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <Avatar className="h-10 w-10 flex-shrink-0">
                              <AvatarImage src={user.avatarUrl || undefined} />
                              <AvatarFallback>
                                {user.firstName?.[0]}
                                {user.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            title="Editar usuario"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetPassword(user)}
                            title="Restablecer contraseña"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            title="Eliminar usuario"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Rol:</span>
                          <Badge
                            variant={getRoleBadgeVariant(user.role)}
                            className="gap-1"
                          >
                            {getRoleIcon(user.role)}
                            {user.role.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Agencia:</span>
                          <span className="text-sm text-muted-foreground">
                            {user.agency ? (
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {user.agency.name}
                              </div>
                            ) : (
                              "N/A"
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Contacto:</span>
                          <span className="text-sm text-muted-foreground">
                            {user.phone ? (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {user.phone}
                              </div>
                            ) : (
                              "N/A"
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Creado:</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credentials Modal */}
      {createdUserCredentials && (
        <CredentialsModal
          isOpen={isCredentialsModalOpen}
          onClose={() => {
            setIsCredentialsModalOpen(false);
            setCreatedUserCredentials(null);
          }}
          userData={createdUserCredentials}
        />
      )}

      {/* Reset Credentials Modal */}
      {resetUserCredentials && (
        <CredentialsModal
          isOpen={isResetCredentialsModalOpen}
          onClose={() => {
            setIsResetCredentialsModalOpen(false);
            setResetUserCredentials(null);
          }}
          userData={resetUserCredentials}
          isPasswordReset={true}
        />
      )}

      {/* Delete Confirmation Modal */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirmar Eliminación de Usuario
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              {userToDelete && userAssets && (
                <div className="space-y-4">
                  <div>
                    ¿Estás seguro de que quieres eliminar al usuario{" "}
                    <span className="font-semibold">
                      {userToDelete.firstName} {userToDelete.lastName}
                    </span>
                    ?
                  </div>

                  {(userAssets.propertiesCount > 0 ||
                    userAssets.projectsCount > 0) && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Trash2 className="h-4 w-4 text-red-600" />
                        <span className="font-semibold text-red-800">
                          ⚠️ Advertencia: Este usuario tiene contenido asociado
                        </span>
                      </div>
                      <div className="text-sm text-red-700 space-y-1">
                        {userAssets.propertiesCount > 0 && (
                          <div>
                            •{" "}
                            <span className="font-medium">
                              {userAssets.propertiesCount}
                            </span>{" "}
                            {userAssets.propertiesCount === 1
                              ? "propiedad"
                              : "propiedades"}{" "}
                            serán eliminadas
                          </div>
                        )}
                        {userAssets.projectsCount > 0 && (
                          <div>
                            •{" "}
                            <span className="font-medium">
                              {userAssets.projectsCount}
                            </span>{" "}
                            {userAssets.projectsCount === 1
                              ? "proyecto"
                              : "proyectos"}{" "}
                            serán eliminados
                          </div>
                        )}
                        <div className="mt-2 font-medium">
                          Esta acción no se puede deshacer. Todo el contenido
                          asociado será eliminado permanentemente.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && performUserDeletion(userToDelete)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Eliminando..." : "Sí, Eliminar Usuario"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
