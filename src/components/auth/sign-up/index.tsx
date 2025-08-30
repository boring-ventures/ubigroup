import Link from "next/link";
import { Card } from "@/components/ui/card";
import AuthLayout from "../auth-layout";
import { SignUpForm } from "./components/sign-up-form";

export default function SignUp() {
  return (
    <AuthLayout>
      <Card className="p-6">
        <div className="mb-2 flex flex-col space-y-2 text-left">
          <h1 className="text-lg font-semibold tracking-tight">
            Crear una cuenta
          </h1>
          <p className="text-sm text-muted-foreground">
            Ingresa tu correo electrónico y contraseña para crear una cuenta.{" "}
            <br />
            ¿Ya tienes una cuenta?{" "}
            <Link
              href="/sign-in"
              className="underline underline-offset-4 hover:text-primary"
            >
              Iniciar Sesión
            </Link>
          </p>
        </div>
        <SignUpForm />
        <p className="mt-4 px-8 text-center text-sm text-muted-foreground">
          Al crear una cuenta, aceptas nuestros{" "}
          <a
            href="/terms"
            className="underline underline-offset-4 hover:text-primary"
          >
            Términos de Servicio
          </a>{" "}
          y{" "}
          <a
            href="/privacy"
            className="underline underline-offset-4 hover:text-primary"
          >
            Política de Privacidad
          </a>
          .
        </p>
      </Card>
    </AuthLayout>
  );
}
