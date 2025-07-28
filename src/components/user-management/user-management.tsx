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
  Mail,
  Key,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { PasswordInput } from "@/components/utils/password-input";

// Types
interface User {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  role: "SUPER_ADMIN" | "AGENCY_ADMIN" | "AGENT";
  phone: string | null;
  whatsapp: string | null;
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
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  role: z.enum(["SUPER_ADMIN", "AGENCY_ADMIN", "AGENT"]),
  phone: z.string().min(10, "Phone must be at least 10 characters").optional(),
  whatsapp: z
    .string()
    .min(10, "WhatsApp must be at least 10 characters")
    .optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  agencyId: z.string().optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface UserManagementProps {
  onUserUpdate?: () => void;
}

export function UserManagement({ onUserUpdate }: UserManagementProps) {
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

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "AGENT",
      phone: "",
      whatsapp: "",
      password: "",
      agencyId: "",
    },
  });

  const editForm = useForm<Omit<CreateUserFormData, "email" | "password">>({
    resolver: zodResolver(
      createUserSchema.omit({ email: true, password: true })
    ),
    defaultValues: {
      firstName: "",
      lastName: "",
      role: "AGENT",
      phone: "",
      whatsapp: "",
      agencyId: "",
    },
  });

  const watchedRole = form.watch("role");
  const watchedEditRole = editForm.watch("role");

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
        description: "Failed to fetch users",
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

      // Prepare user data - send raw password, API will handle auth creation
      const userData = {
        email: data.email,
        password: data.password, // Send raw password
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        agencyId: data.role === "SUPER_ADMIN" ? null : data.agencyId || null,
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
          toast({
            title: "✅ Usuario Creado Exitosamente",
            description: `Usuario creado con acceso completo. Puede iniciar sesión inmediatamente con: ${data.email}`,
          });
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
        throw new Error(result.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Failed to create user:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create user",
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
      phone: user.phone || "",
      whatsapp: user.whatsapp || "",
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

      const updateData = {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        agencyId: data.role === "SUPER_ADMIN" ? null : data.agencyId || null,
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
        throw new Error(result.error || "Failed to update user");
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
        toast({
          title: "✅ Contraseña Actualizada",
          description:
            "La contraseña del usuario ha sido actualizada exitosamente.",
        });
        setIsPasswordDialogOpen(false);
        setPasswordUser(null);
      } else {
        throw new Error(result.error || "Failed to reset password");
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

  // Delete user
  const handleDeleteUser = async (user: User) => {
    if (
      window.confirm(
        `¿Estás seguro de que quieres eliminar al usuario ${user.firstName} ${user.lastName}?`
      )
    ) {
      try {
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
          throw new Error(result.error || "Failed to delete user");
        }
      } catch (error) {
        console.error("Failed to delete user:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Error al eliminar usuario",
          variant: "destructive",
        });
      }
    }
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userId.toLowerCase().includes(searchTerm.toLowerCase());

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
    return <div className="flex justify-center p-8">Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>System Users</CardTitle>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account with the specified role and
                    permissions.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
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
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="user@example.com" {...field} />
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
                          <FormLabel>Role</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="SUPER_ADMIN">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4" />
                                  Super Admin
                                </div>
                              </SelectItem>
                              <SelectItem value="AGENCY_ADMIN">
                                <div className="flex items-center gap-2">
                                  <Settings className="h-4 w-4" />
                                  Agency Admin
                                </div>
                              </SelectItem>
                              <SelectItem value="AGENT">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  Agent
                                </div>
                              </SelectItem>
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
                            <FormLabel>Agency</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an agency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {agencies.map((agency) => (
                                  <SelectItem key={agency.id} value={agency.id}>
                                    <div className="flex items-center gap-2">
                                      <Building2 className="h-4 w-4" />
                                      {agency.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="+1234567890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="whatsapp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>WhatsApp (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="+1234567890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <PasswordInput placeholder="********" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="submit" disabled={isCreating}>
                        {isCreating ? "Creating..." : "Create User"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
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
                    <div className="grid grid-cols-2 gap-4">
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
                              <SelectItem value="SUPER_ADMIN">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4" />
                                  Super Admin
                                </div>
                              </SelectItem>
                              <SelectItem value="AGENCY_ADMIN">
                                <div className="flex items-center gap-2">
                                  <Settings className="h-4 w-4" />
                                  Agency Admin
                                </div>
                              </SelectItem>
                              <SelectItem value="AGENT">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  Agent
                                </div>
                              </SelectItem>
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
                                  <SelectItem key={agency.id} value={agency.id}>
                                    <div className="flex items-center gap-2">
                                      <Building2 className="h-4 w-4" />
                                      {agency.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={editForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono (Opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="+1234567890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="whatsapp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>WhatsApp (Opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="+1234567890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

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
              <DialogContent className="sm:max-w-[400px]">
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
                    <PasswordInput
                      name="newPassword"
                      placeholder="Ingresa la nueva contraseña"
                      className="mt-1"
                      required
                      minLength={8}
                    />
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
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="AGENCY_ADMIN">Agency Admin</SelectItem>
                <SelectItem value="AGENT">Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Agency</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No users found
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
                              {user.userId}
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
                        <div className="space-y-1">
                          {user.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </div>
                          )}
                          {user.whatsapp && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3" />
                              {user.whatsapp}
                            </div>
                          )}
                        </div>
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
        </CardContent>
      </Card>
    </div>
  );
}
