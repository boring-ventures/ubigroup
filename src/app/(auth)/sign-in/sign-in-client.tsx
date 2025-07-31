"use client";

import { SignInPage, Testimonial } from "@/components/ui/sign-in";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

const sampleTestimonials: Testimonial[] = [
  {
    avatarSrc: "https://randomuser.me/api/portraits/women/57.jpg",
    name: "María González",
    handle: "@mariag",
    text: "¡Plataforma increíble! La experiencia de usuario es fluida y las funciones son exactamente lo que necesitaba.",
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/64.jpg",
    name: "Carlos Rodríguez",
    handle: "@carlosr",
    text: "Este servicio ha transformado mi forma de trabajar. Diseño limpio, funciones potentes y excelente soporte.",
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "Ana Martínez",
    handle: "@anam",
    text: "He probado muchas plataformas, pero esta destaca. Intuitiva, confiable y genuinamente útil para la productividad.",
  },
];

export default function SignInPageClient() {
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await signIn(email, password);
      toast({
        title: "Éxito",
        description: "Has iniciado sesión correctamente.",
      });
      // Remove hardcoded redirect - auth provider handles role-based redirection
    } catch (error) {
      toast({
        title: "Error",
        description: "Correo electrónico o contraseña inválidos.",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = () => {
    router.push("/forgot-password");
  };

  return (
    <div className="bg-background text-foreground">
      <SignInPage
        title={
          <span className="font-light text-foreground tracking-tighter">
            Bienvenido a UbiGroup
          </span>
        }
        description="Accede a tu cuenta y continúa tu viaje con nosotros"
        heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
        testimonials={sampleTestimonials}
        onSignIn={handleSignIn}
        onResetPassword={handleResetPassword}
      />
    </div>
  );
}
