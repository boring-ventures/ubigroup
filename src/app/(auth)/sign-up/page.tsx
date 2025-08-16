import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import AuthLayout from "@/components/auth/auth-layout";
import { SignUpForm } from "@/components/auth/sign-up/components/sign-up-form";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Crear Cuenta",
  description: "Crea una nueva cuenta en UbiGroup",
};

export default function SignUpPage() {
  return (
    <AuthLayout>
      <Card className="p-6">
        <div className="flex flex-col space-y-2 text-left">
          <h1 className="text-2xl font-semibold tracking-tight">
            Crear Cuenta
          </h1>
          <p className="text-sm text-muted-foreground">
            Ingresa tus datos para crear tu cuenta.{" "}
            <Link
              href="/sign-in"
              className="underline underline-offset-4 hover:text-primary"
            >
              ¿Ya tienes una cuenta? Inicia sesión
            </Link>
          </p>
        </div>
        <SignUpForm />
      </Card>
    </AuthLayout>
  );
}
