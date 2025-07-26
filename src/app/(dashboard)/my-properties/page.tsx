import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AgentPropertiesTable } from "@/components/dashboard/agent-properties-table";

export default async function MyPropertiesPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get user profile to verify they are an agent
  const userProfile = await prisma.user.findUnique({
    where: { userId: user.id },
  });

  if (!userProfile || userProfile.role !== "AGENT") {
    redirect("/dashboard");
  }

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Properties</h1>
          <p className="text-muted-foreground">
            Manage your property listings and track their approval status
          </p>
        </div>
      </div>

      <AgentPropertiesTable />
    </main>
  );
}
