import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ProjectsList } from "@/components/dashboard/projects-list";

export default async function ProjectsPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get user profile from database to check role
  const userProfile = await prisma.user.findUnique({
    where: { userId: user.id },
    include: {
      agency: true,
    },
  });

  if (!userProfile) {
    redirect("/sign-up");
  }

  // Only agents can access projects page
  if (userProfile.role !== "AGENT") {
    redirect("/dashboard");
  }

  return (
    <main className="flex-1 space-y-4 p-2 sm:p-4 md:p-8 pt-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
          Mis Proyectos
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Gestiona y visualiza todos tus proyectos inmobiliarios
        </p>
      </div>
      <ProjectsList />
    </main>
  );
}
