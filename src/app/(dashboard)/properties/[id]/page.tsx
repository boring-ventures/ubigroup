import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { PropertyDetailPage } from "@/components/dashboard/property-detail-page";

interface PropertyPageProps {
  params: {
    id: string;
  };
}

export default async function DashboardPropertyPage({
  params,
}: PropertyPageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get user profile to verify access
  const userProfile = await prisma.user.findUnique({
    where: { userId: user.id },
  });

  if (!userProfile) {
    redirect("/sign-in");
  }

  // Fetch property data directly from database
  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: {
      agent: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          phone: true,
          whatsapp: true,
        },
      },
      agency: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
        },
      },
    },
  });

  if (!property) {
    redirect("/my-properties");
  }

  // Check access permissions
  let hasAccess = false;
  switch (userProfile.role) {
    case "SUPER_ADMIN":
      hasAccess = true; // Super admin can access any property
      break;
    case "AGENCY_ADMIN":
      hasAccess = property.agencyId === userProfile.agencyId;
      break;
    case "AGENT":
      hasAccess = property.agentId === userProfile.id;
      break;
  }

  if (!hasAccess) {
    redirect("/my-properties");
  }

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PropertyDetailPage
        propertyId={params.id}
        userRole={userProfile.role}
        initialProperty={property}
      />
    </main>
  );
}
