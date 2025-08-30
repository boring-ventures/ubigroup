"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Save,
  Loader2,
  Globe,
  Shield,
  Users,
  Home,
  AlertTriangle,
} from "lucide-react";

const systemConfigSchema = z.object({
  platformName: z
    .string()
    .min(2, "El nombre de la plataforma debe tener al menos 2 caracteres"),
  platformDescription: z.string().optional(),
  supportEmail: z.string().email("Dirección de correo electrónico inválida"),
  maxPropertiesPerAgent: z
    .number()
    .min(1, "Debe ser al menos 1")
    .max(1000, "No puede exceder 1000"),
  autoApproveProperties: z.boolean(),
  requirePropertyVerification: z.boolean(),
  allowPublicRegistration: z.boolean(),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().optional(),
  maxImageUploadSize: z
    .number()
    .min(1, "Debe ser al menos 1 MB")
    .max(50, "No puede exceder 50 MB"),
});

type SystemConfigFormData = z.infer<typeof systemConfigSchema>;

export function SuperAdminSystemConfig() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const form = useForm<SystemConfigFormData>({
    resolver: zodResolver(systemConfigSchema),
    defaultValues: {
      platformName: "Plataforma Inmobiliaria UbiGroup",
      platformDescription:
        "Una plataforma integral de gestión inmobiliaria para agencias y agentes.",
      supportEmail: "support@ubigroup.com",
      maxPropertiesPerAgent: 100,
      autoApproveProperties: false,
      requirePropertyVerification: true,
      allowPublicRegistration: false,
      maintenanceMode: false,
      maintenanceMessage:
        "La plataforma está actualmente en mantenimiento. Por favor, vuelve más tarde.",
      maxImageUploadSize: 10,
    },
  });

  const onSubmit = async () => {
    try {
      setIsLoading(true);

      // In a real implementation, this would call an API
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      toast({
        title: "Configuración Guardada",
        description:
          "La configuración del sistema se ha actualizado exitosamente.",
      });

      setLastSaved(new Date());
    } catch {
      toast({
        title: "Error",
        description:
          "Error al guardar la configuración del sistema. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    form.reset();
    toast({
      title: "Configuración Restablecida",
      description:
        "La configuración se ha restablecido a los valores predeterminados.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuración del Sistema</h2>
          <p className="text-muted-foreground">
            Gestiona configuraciones y ajustes de toda la plataforma
          </p>
        </div>
        {lastSaved && (
          <Badge variant="outline" className="text-green-600 border-green-200">
            Última vez guardado: {lastSaved.toLocaleTimeString()}
          </Badge>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Platform Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Configuración de la Plataforma
              </CardTitle>
              <CardDescription>
                Información básica de la plataforma y marca
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="platformName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Plataforma</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Plataforma Inmobiliaria UbiGroup"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      El nombre mostrado en toda la plataforma
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="platformDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción de la Plataforma</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Una plataforma integral de gestión inmobiliaria..."
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Breve descripción mostrada en páginas públicas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supportEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email de Soporte</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="support@ubigroup.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Dirección de correo electrónico para consultas de soporte
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Property Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Gestión de Propiedades
              </CardTitle>
              <CardDescription>
                Configura ajustes de listado y aprobación de propiedades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="maxPropertiesPerAgent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máximo de Propiedades por Agente</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Número máximo de propiedades que un agente puede listar
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="autoApproveProperties"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Auto-aprobar Propiedades
                      </FormLabel>
                      <FormDescription>
                        Aprobar automáticamente listados de propiedades sin
                        revisión manual
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requirePropertyVerification"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Requerir Verificación de Propiedades
                      </FormLabel>
                      <FormDescription>
                        Requerir que los agentes proporcionen documentos de
                        verificación para las propiedades
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxImageUploadSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamaño Máximo de Carga de Imagen (MB)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Tamaño máximo de archivo para cargas de imágenes de
                      propiedades
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* User Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestión de Usuarios
              </CardTitle>
              <CardDescription>
                Configura ajustes de registro y acceso de usuarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="allowPublicRegistration"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Permitir Registro Público
                      </FormLabel>
                      <FormDescription>
                        Permitir que los usuarios se registren sin invitación
                        (agentes y administradores de agencia)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* System Maintenance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Mantenimiento del Sistema
              </CardTitle>
              <CardDescription>
                Configura ajustes de mantenimiento del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="maintenanceMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        Modo de Mantenimiento
                      </FormLabel>
                      <FormDescription>
                        Habilita el modo de mantenimiento para prevenir el
                        acceso de usuarios durante actualizaciones
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("maintenanceMode") && (
                <FormField
                  control={form.control}
                  name="maintenanceMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensaje de Mantenimiento</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="La plataforma está actualmente en mantenimiento..."
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        Mensaje mostrado a los usuarios durante el mantenimiento
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  Restablecer a Predeterminados
                </Button>

                <div className="flex space-x-2">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Configuración
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
