import { Suspense } from "react";
import { PublicPropertyCatalog } from "@/components/public/public-property-catalog";

export default function MainPage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        }
      >
        <PublicPropertyCatalog />
      </Suspense>
    </main>
  );
}
