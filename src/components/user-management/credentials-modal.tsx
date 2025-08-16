"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, User, Mail, Key, Building2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface CredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    agencyName?: string;
  };
  isPasswordReset?: boolean;
}

export function CredentialsModal({
  isOpen,
  onClose,
  userData,
  isPasswordReset = false,
}: CredentialsModalProps) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: "Copiado",
        description: `${field} copiado al portapapeles`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive",
      });
    }
  };

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

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Super Administrador";
      case "AGENCY_ADMIN":
        return "Administrador de Agencia";
      case "AGENT":
        return "Agente";
      default:
        return role;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[500px] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isPasswordReset
              ? "Contraseña Actualizada"
              : "Usuario Creado Exitosamente"}
          </DialogTitle>
          <DialogDescription>
            {isPasswordReset
              ? "La contraseña del usuario ha sido actualizada exitosamente. Guarda estas credenciales de forma segura."
              : "El usuario ha sido creado y puede iniciar sesión inmediatamente. Guarda estas credenciales de forma segura."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          {/* User Info Card */}
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                {isPasswordReset
                  ? "Información del Usuario"
                  : "Información del Usuario"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                <span className="text-sm font-medium">Nombre:</span>
                <span className="text-sm">
                  {userData.firstName} {userData.lastName}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                <span className="text-sm font-medium">Rol:</span>
                <Badge variant={getRoleBadgeVariant(userData.role)}>
                  {getRoleLabel(userData.role)}
                </Badge>
              </div>
              {userData.agencyName && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                  <span className="text-sm font-medium">Agencia:</span>
                  <span className="text-sm flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {userData.agencyName}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Credentials Card */}
          <Card className="border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-orange-800 dark:text-orange-200">
                <Key className="h-4 w-4" />
                {isPasswordReset
                  ? "Nueva Contraseña"
                  : "Credenciales de Acceso"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              {/* Email */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    Correo Electrónico:
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(userData.email, "email")}
                    className="h-6 px-2 self-end sm:self-auto"
                  >
                    {copiedField === "email" ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className="bg-background border border-border p-1.5 sm:p-2 rounded font-mono text-xs sm:text-sm break-all">
                  {userData.email}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Key className="h-3 w-3" />
                    Contraseña:
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(userData.password, "password")
                    }
                    className="h-6 px-2 self-end sm:self-auto"
                  >
                    {copiedField === "password" ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className="bg-background border border-border p-1.5 sm:p-2 rounded font-mono text-xs sm:text-sm break-all">
                  {userData.password}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Notice */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2 sm:p-3">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Importante:</p>
                <ul className="space-y-1 text-xs">
                  {!isPasswordReset && (
                    <li>
                      • El usuario deberá cambiar su contraseña en el primer
                      inicio de sesión
                    </li>
                  )}
                  <li>• Guarda estas credenciales de forma segura</li>
                  <li>• El usuario puede acceder inmediatamente al sistema</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 sm:pt-4">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            onClick={() => {
              copyToClipboard(
                `Email: ${userData.email}\nContraseña: ${userData.password}`,
                "credentials"
              );
            }}
          >
            Copiar Todo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
