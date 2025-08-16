"use client";

import { useState } from "react";
import Image from "next/image";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { uploadLogo } from "@/lib/supabase/upload-logo";

interface LogoUploadProps {
  agencyId: string;
  currentLogoUrl: string | null;
  onUploadComplete: (url: string) => void;
  onUploadError: (error: Error) => void;
}

export function LogoUpload({
  agencyId,
  currentLogoUrl,
  onUploadComplete,
  onUploadError,
}: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setIsUploading(true);
      const logoUrl = await uploadLogo(file, agencyId);
      onUploadComplete(logoUrl);
      toast({
        title: "Logo actualizado",
        description: "El logo de tu agencia ha sido actualizado exitosamente.",
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      onUploadError(
        error instanceof Error
          ? error
          : new Error("Error al subir el logo de la agencia")
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-24 w-24">
        {previewUrl || currentLogoUrl ? (
          <Image
            src={previewUrl || currentLogoUrl || ""}
            alt="Vista previa del logo"
            fill
            className="rounded-full object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex flex-col items-center gap-2">
        <Button variant="outline" className="relative" disabled={isUploading}>
          {isUploading ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-opacity-20 border-t-current"></span>
              Subiendo...
            </>
          ) : (
            "Cambiar Logo"
          )}
          <input
            type="file"
            accept="image/*,.webp"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
        </Button>
        <p className="text-xs text-muted-foreground">
          PNG, JPG o GIF. Máximo 2MB.
        </p>
      </div>
    </div>
  );
}
