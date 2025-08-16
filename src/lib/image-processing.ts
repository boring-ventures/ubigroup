// Server-side only image processing
import type { Sharp } from "sharp";

let sharp: ((input?: Buffer | string) => Sharp) | null = null;

// Dynamically import sharp only on server side
if (typeof window === "undefined") {
  try {
    const sharpModule = await import("sharp");
    sharp = sharpModule.default;
  } catch (error) {
    console.warn("Sharp not available:", error);
  }
}

export interface ImageProcessingOptions {
  quality?: number;
  width?: number;
  height?: number;
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  format?: "webp" | "jpeg" | "png";
}

export async function convertImageToWebP(
  buffer: Buffer,
  options: ImageProcessingOptions = {}
): Promise<Buffer> {
  // Only process on server side
  if (typeof window !== "undefined") {
    throw new Error("Image processing is only available on the server side");
  }

  if (!sharp) {
    throw new Error("Sharp library not available");
  }

  const { quality = 80, width, height, fit = "inside" } = options;

  try {
    let sharpInstance = sharp(buffer);

    // Resize if dimensions are provided
    if (width || height) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit,
        withoutEnlargement: true,
      });
    }

    // Convert to WebP
    const processedBuffer = await sharpInstance.webp({ quality }).toBuffer();

    console.log(
      `Image converted to WebP: ${buffer.length} bytes -> ${processedBuffer.length} bytes`
    );

    return processedBuffer;
  } catch (error) {
    console.error("Error converting image to WebP:", error);
    throw new Error("Failed to process image");
  }
}

export async function processImageFile(
  file: File,
  options: ImageProcessingOptions = {}
): Promise<File> {
  // Only process on server side
  if (typeof window !== "undefined") {
    throw new Error("Image processing is only available on the server side");
  }

  try {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert to WebP
    const webpBuffer = await convertImageToWebP(buffer, options);

    // Create new File with WebP extension
    const fileName = file.name.replace(/\.[^/.]+$/, ".webp");
    const webpFile = new File([webpBuffer], fileName, {
      type: "image/webp",
      lastModified: file.lastModified,
    });

    return webpFile;
  } catch (error) {
    console.error("Error processing image file:", error);
    throw error;
  }
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export function shouldConvertToWebP(file: File): boolean {
  // Convert all image types except WebP (to avoid double conversion)
  return isImageFile(file) && file.type !== "image/webp";
}
