import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { SuperAdminAllProperties } from "@/components/dashboard/super-admin-all-properties";

export default async function AllPropertiesPage() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/sign-in");
  }

  // Get user profile to verify they are a super admin
  const userProfile = await prisma.user.findUnique({
    where: { userId: session.user.id },
  });

  if (!userProfile || userProfile.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Properties</h1>
          <p className="text-muted-foreground">
            Platform-wide property management and oversight
          </p>
        </div>
      </div>

      <SuperAdminAllProperties />
    </main>
  );
}
