import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { PendingPropertyDetailPage } from "@/components/dashboard/pending-property-detail-page";

interface PendingPropertyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PendingPropertyPage({
  params,
}: PendingPropertyPageProps) {
  const { id } = await params;
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

  // Fetch pending property data directly from database
  const property = await prisma.property.findUnique({
    where: {
      id,
      status: "PENDING", // Only fetch pending properties
    },
    include: {
      agent: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          phone: true,
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
    redirect("/properties/pending");
  }

  // Check if the property belongs to the user's agency
  if (property.agencyId !== userProfile.agencyId) {
    redirect("/properties/pending");
  }

  // Convert Date to string for createdAt and handle null values
  const propertyWithStringDates = {
    ...property,
    createdAt: property.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: property.updatedAt?.toISOString() || new Date().toISOString(),
    address: property.address || undefined,
    municipality: property.municipality || undefined,
    googleMapsUrl: property.googleMapsUrl || undefined,
    latitude: property.latitude ?? undefined,
    longitude: property.longitude ?? undefined,
    agent: property.agent || {
      id: "",
      firstName: null,
      lastName: null,
      avatarUrl: null,
      phone: null,
    },
    agency: property.agency || {
      id: "",
      name: "",
      logoUrl: null,
    },
  };

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PendingPropertyDetailPage initialProperty={propertyWithStringDates} />
    </main>
  );
}
