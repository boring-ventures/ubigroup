/**
 * Converts an image file to WebP format with compression for better performance
 * @param file - The original image file
 * @param quality - WebP quality (0-1), default 0.8
 * @param maxWidth - Maximum width for the image, default 1920
 * @param maxHeight - Maximum height for the image, default 1080
 * @returns Promise<File> - The converted and compressed WebP file
 */
export async function convertToWebP(
  file: File,
  quality: number = 0.8,
  maxWidth: number = 1920,
  maxHeight: number = 1080
): Promise<File> {
  return new Promise((resolve, reject) => {
    // Create a canvas element
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Canvas context not available"));
      return;
    }

    // Create an image element
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        // Set canvas dimensions to the calculated size
        canvas.width = width;
        canvas.height = height;

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Draw the image on the canvas with new dimensions
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create a new file with WebP extension
              const webpFile = new File(
                [blob],
                `${file.name.replace(/\.[^/.]+$/, "")}.webp`,
                {
                  type: "image/webp",
                  lastModified: Date.now(),
                }
              );
              resolve(webpFile);
            } else {
              reject(new Error("Failed to convert image to WebP"));
            }
          },
          "image/webp",
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    // Load the image from the file
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Checks if the browser supports WebP format
 * @returns Promise<boolean> - True if WebP is supported
 */
export function isWebPSupported(): boolean {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return false;
  }

  try {
    // Try to convert to WebP
    const dataURL = canvas.toDataURL("image/webp", 0.1);
    return dataURL.indexOf("data:image/webp") === 0;
  } catch {
    return false;
  }
}

/**
 * Checks if an image needs compression based on its size
 * @param file - The image file to check
 * @param maxSizeMB - Maximum size in MB before compression is recommended, default 1MB
 * @returns boolean - True if compression is recommended
 */
export function needsCompression(file: File, maxSizeMB: number = 1): boolean {
  const fileSizeMB = file.size / (1024 * 1024);
  return fileSizeMB > maxSizeMB;
}

/**
 * Gets recommended compression settings based on file size
 * @param file - The image file
 * @returns object - Recommended quality and max dimensions
 */
export function getCompressionSettings(file: File): {
  quality: number;
  maxWidth: number;
  maxHeight: number;
} {
  const fileSizeMB = file.size / (1024 * 1024);

  if (fileSizeMB > 5) {
    // Very large files: aggressive compression
    return { quality: 0.6, maxWidth: 1600, maxHeight: 900 };
  } else if (fileSizeMB > 2) {
    // Large files: moderate compression
    return { quality: 0.7, maxWidth: 1920, maxHeight: 1080 };
  } else if (fileSizeMB > 1) {
    // Medium files: light compression
    return { quality: 0.8, maxWidth: 1920, maxHeight: 1080 };
  } else {
    // Small files: minimal compression
    return { quality: 0.85, maxWidth: 1920, maxHeight: 1080 };
  }
}

/**
 * Optimizes an image file by converting to WebP with compression if supported, otherwise returns original
 * @param file - The original image file
 * @param quality - WebP quality (0-1), default 0.8
 * @param maxWidth - Maximum width for the image, default 1920
 * @param maxHeight - Maximum height for the image, default 1080
 * @returns Promise<File> - The optimized file (WebP if supported, original otherwise)
 */
export async function optimizeImage(
  file: File,
  quality: number = 0.8,
  maxWidth: number = 1920,
  maxHeight: number = 1080
): Promise<File> {
  // Check if the file is already WebP
  if (file.type === "image/webp") {
    return file;
  }

  // Check if WebP is supported
  if (!isWebPSupported()) {
    console.warn("WebP not supported in this browser, using original format");
    return file;
  }

  // Check if the file is a supported image type
  const supportedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
  if (!supportedTypes.includes(file.type)) {
    console.warn(
      "Unsupported image type for WebP conversion, using original format"
    );
    return file;
  }

  try {
    const webpFile = await convertToWebP(file, quality, maxWidth, maxHeight);
    const originalSize = file.size;
    const compressedSize = webpFile.size;
    const compressionRatio = (
      ((originalSize - compressedSize) / originalSize) *
      100
    ).toFixed(1);

    console.log(
      `Converted ${file.name} to WebP format: ${(originalSize / 1024 / 1024).toFixed(2)}MB -> ${(compressedSize / 1024 / 1024).toFixed(2)}MB (${compressionRatio}% reduction)`
    );
    return webpFile;
  } catch (error) {
    console.error("Failed to convert image to WebP:", error);
    return file; // Fallback to original file
  }
}
