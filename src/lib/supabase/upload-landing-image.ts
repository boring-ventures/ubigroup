import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  optimizeImage,
  needsCompression,
  getCompressionSettings,
} from "@/lib/image-processing";

const STORAGE_BUCKET = "landing-images";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

export async function uploadLandingImage(file: File) {
  // Validate file before upload
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      "Invalid file type. Please upload a JPEG, PNG, GIF or WebP image."
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      "File size too large. Please upload an image smaller than 10MB."
    );
  }

  try {
    const supabase = createClientComponentClient();

    // Optimize image to WebP format with compression for better performance
    let optimizedFile = file;

    if (needsCompression(file, 0.5)) {
      // Compress if larger than 0.5MB
      const settings = getCompressionSettings(file);
      console.log(
        `Compressing image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) with settings:`,
        settings
      );

      optimizedFile = await optimizeImage(
        file,
        settings.quality,
        settings.maxWidth,
        settings.maxHeight
      );
    } else {
      console.log(
        `Image ${file.name} is small enough (${(file.size / 1024 / 1024).toFixed(2)}MB), skipping compression`
      );
    }

    // Generate unique filename with .webp extension
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const fileName = `landing-${timestamp}-${randomId}.webp`;
    const filePath = `${fileName}`;

    // Upload optimized file
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, optimizedFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
    const optimizedSizeMB = (optimizedFile.size / 1024 / 1024).toFixed(2);
    const compressionRatio = (
      ((file.size - optimizedFile.size) / file.size) *
      100
    ).toFixed(1);

    console.log(
      `Uploaded optimized image: ${file.name} -> ${fileName} (${originalSizeMB}MB -> ${optimizedSizeMB}MB, ${compressionRatio}% reduction)`
    );

    return publicUrl;
  } catch (error) {
    console.error("Error uploading landing image:", error);
    throw error;
  }
}
