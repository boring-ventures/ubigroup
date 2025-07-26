import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { PropertyForm } from "@/components/dashboard/property-form";

export default async function CreatePropertyPage() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/sign-in");
  }

  // Get user profile to verify they are an agent
  const userProfile = await prisma.user.findUnique({
    where: { userId: session.user.id },
  });

  if (!userProfile || userProfile.role !== "AGENT") {
    redirect("/dashboard");
  }

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Property</h1>
          <p className="text-muted-foreground">
            Add a new property listing for approval
          </p>
        </div>
      </div>

      <PropertyForm
        onSuccess={() => {
          // Redirect to properties list after successful creation
          window.location.href = "/my-properties";
        }}
        onCancel={() => {
          // Redirect back to properties list
          window.location.href = "/my-properties";
        }}
      />
    </main>
  );
}
