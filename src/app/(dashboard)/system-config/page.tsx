import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { SuperAdminSystemConfig } from "@/components/dashboard/super-admin-system-config";

export default async function SystemConfigPage() {
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
      <SuperAdminSystemConfig />
    </main>
  );
}
