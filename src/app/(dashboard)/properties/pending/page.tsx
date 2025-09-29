import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { PendingPropertiesApproval } from "@/components/dashboard/pending-properties-approval";
import { PendingProjectsApproval } from "@/components/dashboard/pending-projects-approval";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Building2 } from "lucide-react";

export default async function PendingPropertiesPage() {
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
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Aprobaciones Pendientes
          </h1>
          <p className="text-muted-foreground">
            Revisa y aprueba las propiedades y proyectos enviados por tus agentes
          </p>
        </div>
      </div>

      <Tabs defaultValue="properties" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="properties" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Propiedades
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Proyectos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="space-y-4">
          <PendingPropertiesApproval />
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <PendingProjectsApproval />
        </TabsContent>
      </Tabs>
    </main>
  );
}
