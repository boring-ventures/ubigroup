import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AgencyPropertyManagement } from "@/components/dashboard/agency-property-management";
import { AgencyProjectsManagement } from "@/components/dashboard/agency-projects-management";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Home } from "lucide-react";

export default async function PropertiesPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get user profile to verify they are an agency admin
  const userProfile = await prisma.user.findUnique({
    where: { userId: user.id },
  });

  if (!userProfile || userProfile.role !== "AGENCY_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <main className="flex-1 space-y-4 p-2 sm:p-4 md:p-8 pt-6">
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
            Gestión de Propiedades y Proyectos
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Administra propiedades y proyectos de todos tus agentes
          </p>
        </div>
      </div>

      <Tabs defaultValue="properties" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 h-auto sm:h-10">
          <TabsTrigger
            value="properties"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-0"
          >
            <Home className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Propiedades</span>
            <span className="sm:hidden">Props</span>
          </TabsTrigger>
          <TabsTrigger
            value="projects"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-0"
          >
            <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Proyectos</span>
            <span className="sm:hidden">Proy</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="space-y-4">
          <AgencyPropertyManagement />
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <AgencyProjectsManagement />
        </TabsContent>
      </Tabs>
    </main>
  );
}
