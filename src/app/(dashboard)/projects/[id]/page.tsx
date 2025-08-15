import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ProjectDetail } from "@/components/dashboard/project-detail";

export default async function ProjectPage({
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

  // Fetch project data
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      agent: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      agency: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
        },
      },
      floors: {
        include: {
          quadrants: {
            orderBy: { customId: "asc" },
          },
        },
        orderBy: { number: "asc" },
      },
    },
  });

  if (!project) {
    redirect("/projects");
  }

  // Check permissions based on user role
  if (userProfile.role === "AGENT" && project.agentId !== userProfile.id) {
    redirect("/projects");
  }

  if (
    userProfile.role === "AGENCY_ADMIN" &&
    project.agencyId !== userProfile.agencyId
  ) {
    redirect("/projects");
  }

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <ProjectDetail
        project={{
          ...project,
          createdAt: project.createdAt.toISOString(),
        }}
      />
    </main>
  );
}
