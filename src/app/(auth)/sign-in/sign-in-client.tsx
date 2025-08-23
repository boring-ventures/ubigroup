"use client";

import { SignInPage, Testimonial } from "@/components/ui/sign-in";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import Image from "next/image";
import logoDark from "@logos/logo_dark.svg";

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
      console.log(error);
    }
  };

  const handleResetPassword = () => {
    router.push("/forgot-password");
  };

  const LogoComponent = () => (
    <div className="flex flex-col items-center space-y-4">
      <Image
        src={logoDark}
        alt="UbiGroup logo"
        width={82}
        height={82}
        className="h-20 md:h-40 w-auto"
        priority
      />
      <p className="text-sm md:text-lg text-muted-foreground text-center max-w-md">
        Encontrando hogares ideales para un mejor mañana
      </p>
    </div>
  );

  return (
    <div className="bg-background text-foreground dark">
      <SignInPage
        title={
          <span className="font-light text-foreground tracking-tighter">
            Bienvenido a UbiGroup
          </span>
        }
        description="Accede a tu cuenta y continúa tu viaje con nosotros"
        heroLogo={<LogoComponent />}
        testimonials={sampleTestimonials}
        onSignIn={handleSignIn}
        onResetPassword={handleResetPassword}
      />
    </div>
  );
}
