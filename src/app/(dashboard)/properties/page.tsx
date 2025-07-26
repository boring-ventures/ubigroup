import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AgencyPropertyManagement } from "@/components/dashboard/agency-property-management";

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
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Property Management
          </h1>
          <p className="text-muted-foreground">
            View and manage all properties from your agents
          </p>
        </div>
      </div>

      <AgencyPropertyManagement />
    </main>
  );
}
