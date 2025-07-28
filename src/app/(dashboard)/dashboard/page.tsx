import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { SuperAdminDashboard } from "@/components/dashboard/super-admin-dashboard";
import { AgencyAdminDashboard } from "@/components/dashboard/agency-admin-dashboard";
import { AgentDashboard } from "@/components/dashboard/agent-dashboard";

export default async function DashboardPage() {
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

  // Render role-specific dashboard
  const renderDashboard = () => {
    switch (userProfile.role) {
      case "SUPER_ADMIN":
        return <SuperAdminDashboard />;
      case "AGENCY_ADMIN":
        return <AgencyAdminDashboard />;
      case "AGENT":
        return <AgentDashboard />;
      default:
        return (
          <div className="space-y-8">
            <div className="bg-card rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
              <p className="text-muted-foreground">
                Welcome to your dashboard. Your role access is being configured.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Current role: {userProfile.role}
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {renderDashboard()}
    </main>
  );
}
