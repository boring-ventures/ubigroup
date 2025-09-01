import { toast } from "@/components/ui/use-toast";
import {
  optimizeImage,
  getCompressionSettings,
  needsCompression,
} from "@/lib/image-processing";

export const MAX_INDIVIDUAL_FILE_SIZE = 100 * 1024 * 1024;
export const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 1MB total per batch to work with Vercel's strict limits

export async function uploadFiles(
  files: File[],
  type: "images" | "videos" | "documents"
): Promise<string[]> {
  if (!files || files.length === 0) {
    throw new Error("No files provided for upload");
  }

  console.log(`Starting upload of ${files.length} ${type} files`);

  // Compress images before processing (skip for documents)
  let processedFiles = files;
  if (type === "images") {
    console.log("Compressing images before upload...");
    processedFiles = await Promise.all(
      files.map(async (file) => {
        if (file.type.startsWith("image/") && needsCompression(file, 0.8)) {
          const settings = getCompressionSettings(file);
          try {
            const compressedFile = await optimizeImage(
              file,
              settings.quality,
              settings.maxWidth,
              settings.maxHeight
            );
            console.log(
              `Compressed ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
            );
            return compressedFile;
          } catch (error) {
            console.warn(
              `Failed to compress ${file.name}, using original:`,
              error
            );
            return file;
          }
        }
        return file;
      })
    );
  }

  // Split files into batches to avoid 413 errors
  const batches: File[][] = [];
  let currentBatch: File[] = [];
  let currentBatchSize = 0;

  for (const file of processedFiles) {
    // If adding this file would exceed total size, start a new batch
    if (
      currentBatchSize + file.size > MAX_TOTAL_SIZE &&
      currentBatch.length > 0
    ) {
      batches.push([...currentBatch]);
      currentBatch = [file];
      currentBatchSize = file.size;
    } else {
      currentBatch.push(file);
      currentBatchSize += file.size;
    }
  }

  // Add the last batch if it has files
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  console.log(`Split ${files.length} files into ${batches.length} batches`);

  const allUrls: string[] = [];

  // Upload each batch sequentially
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(
      `Uploading batch ${i + 1}/${batches.length} with ${batch.length} files`
    );

    try {
      const batchUrls = await uploadBatch(batch, type);
      allUrls.push(...batchUrls);

      // Show progress for batches with multiple files
      if (batches.length > 1) {
        toast({
          title: "Progreso de subida",
          description: `Lote ${i + 1}/${batches.length} completado (${allUrls.length}/${files.length} archivos)`,
        });
      }
    } catch (error) {
      console.error(`Failed to upload batch ${i + 1}:`, error);
      throw new Error(
        `Error al subir lote ${i + 1}: ${error instanceof Error ? error.message : "Error desconocido"}`
      );
    }
  }

  console.log(`Successfully uploaded all ${allUrls.length} files`);
  return allUrls;
}

async function uploadBatch(
  files: File[],
  type: "images" | "videos" | "documents"
): Promise<string[]> {
  const formData = new FormData();

  // Add files to FormData
  files.forEach((file) => {
    formData.append(`${type}`, file);
  });

  try {
    console.log(`Uploading batch of ${files.length} ${type}...`);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    console.log("Upload response status:", response.status);

    if (!response.ok) {
      let errorMessage = "Upload failed";

      // Handle specific error cases
      if (response.status === 413) {
        errorMessage =
          "El tamaño total de los archivos es demasiado grande. Intenta subir menos archivos a la vez.";
      } else {
        try {
          const errorData = await response.json();
          console.error("Upload API response error:", errorData);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (jsonError) {
          console.error("Failed to parse error response:", jsonError);
          errorMessage = `Upload failed with status ${response.status}`;
        }
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log("Upload successful:", result);

    if (!result.urls || !Array.isArray(result.urls)) {
      throw new Error("Invalid response format from upload API");
    }

    return result.urls;
  } catch (error) {
    console.error("Upload error:", error);

    // Show user-friendly error toast
    const errorMessage =
      error instanceof Error ? error.message : "Unknown upload error";
    toast({
      title: "Error de Subida",
      description: errorMessage,
      variant: "destructive",
    });

    throw error;
  }
}

export function validateFile(
  file: File,
  type: "image" | "video" | "document"
): boolean {
  // Check file size for both images and videos (Supabase Free tier limit)
  if (file.size > MAX_INDIVIDUAL_FILE_SIZE) {
    toast({
      title: "Archivo demasiado grande",
      description: `${file.name} excede el límite de 50MB por archivo`,
      variant: "destructive",
    });
    return false;
  }

  // Check file type
  const validImageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const validVideoTypes = [
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/avi",
    "video/mov",
  ];
  const validDocumentTypes = ["application/pdf"];

  if (type === "image" && !validImageTypes.includes(file.type)) {
    toast({
      title: "Tipo de archivo inválido",
      description: `${file.name} no es un formato de imagen válido`,
      variant: "destructive",
    });
    return false;
  }

  if (type === "video" && !validVideoTypes.includes(file.type)) {
    toast({
      title: "Tipo de archivo inválido",
      description: `${file.name} no es un formato de video válido`,
      variant: "destructive",
    });
    return false;
  }

  if (type === "document" && !validDocumentTypes.includes(file.type)) {
    toast({
      title: "Tipo de archivo inválido",
      description: `${file.name} debe ser un archivo PDF`,
      variant: "destructive",
    });
    return false;
  }

  return true;
}
