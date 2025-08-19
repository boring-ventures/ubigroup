import { Suspense } from "react";
import { LandingImagesManagement } from "@/components/dashboard/landing-images-management";

export default function LandingImagesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gestión de Imágenes del Hero</h1>
        <p className="text-muted-foreground">
          Administra las imágenes que se muestran en la sección hero de la
          página principal.
        </p>
      </div>

      <Suspense fallback={<div>Cargando...</div>}>
        <LandingImagesManagement />
      </Suspense>
    </div>
  );
}
