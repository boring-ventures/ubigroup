import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { PropertiesProjectsTabs } from "@/components/dashboard/properties-projects-tabs";

export default async function MyPropertiesPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get user profile to determine their role
  const userProfile = await prisma.user.findUnique({
    where: { userId: user.id },
  });

  if (!userProfile) {
    redirect("/dashboard");
  }

  // Only allow agents and agency admins to access this page
  if (userProfile.role !== "AGENT" && userProfile.role !== "AGENCY_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {userProfile.role === "AGENT"
              ? "Mis Propiedades y Proyectos"
              : "Propiedades y Proyectos de la Agencia"}
          </h1>
          <p className="text-muted-foreground">
            {userProfile.role === "AGENT"
              ? "Gestiona tus listados de propiedades y proyectos, y rastrea su estado de aprobación"
              : "Gestiona todas las propiedades y proyectos de tu agencia y rastrea su estado de aprobación"}
          </p>
        </div>
      </div>

      <PropertiesProjectsTabs />
    </main>
  );
}
