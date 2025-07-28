import type { Metadata } from "next";
import SignInPageClient from "./sign-in-client";

export const metadata: Metadata = {
  title: "Iniciar Sesión - UbiGroup",
  description: "Inicia sesión en tu cuenta de UbiGroup",
};

export default function SignInPage() {
  return <SignInPageClient />;
}
