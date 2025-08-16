import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import AuthLayout from "@/components/auth/auth-layout";
import { ResetPasswordForm } from "@/components/auth/reset-password/components/reset-password-form";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Restablecer Contraseña",
  description: "Establece una nueva contraseña",
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <Card className="p-6">
        <div className="flex flex-col space-y-2 text-left">
          <h1 className="text-2xl font-semibold tracking-tight">
            Establecer Nueva Contraseña
          </h1>
          <p className="text-sm text-muted-foreground">
            Ingresa tu nueva contraseña a continuación.{" "}
            <Link
              href="/sign-in"
              className="underline underline-offset-4 hover:text-primary"
            >
              Volver a Iniciar Sesión
            </Link>
          </p>
        </div>
        <ResetPasswordForm />
      </Card>
    </AuthLayout>
  );
}
