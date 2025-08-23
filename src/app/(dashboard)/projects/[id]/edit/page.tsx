import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ProjectForm } from "@/components/dashboard/project-form";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const userProfile = await prisma.user.findUnique({
    where: { userId: user.id },
    include: { agency: true },
  });

  if (!userProfile) {
    redirect("/sign-up");
  }

  // Fetch project and verify permissions
  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    redirect("/projects");
  }

  // Only the owning agent can edit
  if (userProfile.role !== "AGENT" || project.agentId !== userProfile.id) {
    redirect("/projects");
  }

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Editar Proyecto</h2>
      </div>
      <ProjectForm
        projectId={project.id}
        initialData={{
          name: project.name,
          description: project.description,
          location: project.location,
          propertyType: project.propertyType,
          images: project.images,
        }}
      />
    </main>
  );
}
