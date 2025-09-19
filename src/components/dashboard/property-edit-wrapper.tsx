"use client";

import { useRouter } from "next/navigation";
import { PropertyForm } from "./property-form";
import type { CreatePropertyInput } from "@/lib/validations/property";

interface PropertyEditWrapperProps {
  initialData: Partial<CreatePropertyInput>;
  propertyId: string;
}

export function PropertyEditWrapper({
  initialData,
  propertyId,
}: PropertyEditWrapperProps) {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/my-properties");
  };

  return (
    <PropertyForm
      initialData={initialData}
      propertyId={propertyId}
      onSuccess={handleSuccess}
    />
  );
}

