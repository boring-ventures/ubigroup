"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Shield, ShieldCheck } from "lucide-react";

export function PasswordRequirementTester() {
  const [isLoading, setIsLoading] = useState(false);

  const setPasswordRequirement = async (requiresChange: boolean) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/test/set-password-requirement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requiresPasswordChange: requiresChange }),
      });

      if (!response.ok) {
        throw new Error("Failed to update password requirement");
      }

      // Reload the page to trigger the modal
      window.location.reload();
    } catch (error) {
      console.error("Error setting password requirement:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2 p-4 bg-muted rounded-lg">
      <Button
        onClick={() => setPasswordRequirement(true)}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Shield className="h-4 w-4" />
        Activar requerimiento
      </Button>
      <Button
        onClick={() => setPasswordRequirement(false)}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <ShieldCheck className="h-4 w-4" />
        Desactivar requerimiento
      </Button>
    </div>
  );
}
