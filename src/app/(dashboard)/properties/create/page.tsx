"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PropertyForm } from "@/components/dashboard/property-form";
import { Skeleton } from "@/components/ui/skeleton";
import type { Profile } from "@/types/profile";

export default function CreatePropertyPage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          router.push("/sign-in");
          return;
        }

        // Get user profile to verify they are an agent
        const response = await fetch("/api/profile");
        if (!response.ok) {
          router.push("/sign-in");
          return;
        }

        const profile: Profile = await response.json();
        if (profile.role !== "AGENT") {
          router.push("/dashboard");
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/sign-in");
      }
    };

    checkAuth();
  }, [router, supabase.auth]);

  if (isLoading) {
    return (
      <main className="flex-1 space-y-4 p-3 sm:p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 sm:h-8 w-32 sm:w-48" />
            <Skeleton className="h-3 sm:h-4 w-48 sm:w-64 mt-2" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </main>
    );
  }

  return (
    <main className="flex-1 space-y-4 p-3 sm:p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Crear Propiedad
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Agrega una nueva lista de propiedad para aprobación
          </p>
        </div>
      </div>

      <PropertyForm
        onSuccess={() => {
          // Redirect to properties list after successful creation
          router.push("/my-properties");
        }}
        onCancel={() => {
          // Redirect back to properties list
          router.push("/my-properties");
        }}
      />
    </main>
  );
}
