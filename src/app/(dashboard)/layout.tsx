import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { DashboardLayoutClient } from "@/components/dashboard/dashboard-layout-client";
import prisma from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/sign-in");
  }

  // Get user profile from database to check role
  const userProfile = await prisma.user.findUnique({
    where: { userId: session.user.id },
    include: {
      agency: true,
    },
  });

  if (!userProfile) {
    // If no profile exists, redirect to sign-up
    redirect("/sign-up");
  }

  // Role-based access control for specific routes
  // This is handled at the component level, but we can add global restrictions here if needed

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
