import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { PropertyForm } from "@/components/dashboard/property-form";
import type { CreatePropertyInput } from "@/lib/validations/property";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const userProfile = await prisma.user.findUnique({
    where: { userId: user.id },
  });

  if (!userProfile) {
    redirect("/sign-in");
  }

  const property = await prisma.property.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      locationState: true,
      locationCity: true,
      municipality: true,
      address: true,
      googleMapsUrl: true,
      latitude: true,
      longitude: true,
      price: true,
      currency: true,
      exchangeRate: true,
      bedrooms: true,
      bathrooms: true,
      garageSpaces: true,
      squareMeters: true,
      transactionType: true,
      images: true,
      videos: true,
      features: true,
      agentId: true,
      agencyId: true,
    },
  });

  if (!property) {
    redirect("/my-properties");
  }

  // Permissions: Super Admin -> all; Agency Admin -> same agency; Agent -> own property
  let hasAccess = false;
  switch (userProfile.role) {
    case "SUPER_ADMIN":
      hasAccess = true;
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

  const initialData: Partial<CreatePropertyInput> = {
    title: property.title || "",
    description: property.description || "",
    price: property.price ?? 0,
    currency: property.currency as CreatePropertyInput["currency"],
    exchangeRate: property.exchangeRate ?? undefined,
    propertyType: property.type,
    transactionType: property.transactionType,
    address: property.address || "",
    city: property.locationCity || "",
    state: property.locationState || "",
    municipality: property.municipality || "",
    googleMapsUrl: property.googleMapsUrl || undefined,
    latitude: property.latitude ?? undefined,
    longitude: property.longitude ?? undefined,
    bedrooms: property.bedrooms ?? 0,
    bathrooms: property.bathrooms ?? 0,
    area: property.squareMeters ?? 0,
    features: property.features ?? [],
    images: property.images ?? [],
    videos: property.videos ?? [],
  };

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Property</h1>
          <p className="text-muted-foreground">Update your property listing</p>
        </div>
      </div>

      <PropertyForm initialData={initialData} propertyId={property.id} />
    </main>
  );
}
