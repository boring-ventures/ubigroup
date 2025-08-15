import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ProjectForm } from "@/components/dashboard/project-form";

export default async function CreateProjectPage() {
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

  // Only agents can create projects
  if (userProfile.role !== "AGENT") {
    redirect("/dashboard");
  }

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Create New Project
        </h2>
      </div>
      <ProjectForm />
    </main>
  );
}
