import { toast } from "@/components/ui/use-toast";

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function uploadFiles(
  files: File[],
  type: "images" | "videos"
): Promise<string[]> {
  const formData = new FormData();

  // Add files to FormData
  files.forEach((file, index) => {
    formData.append(`${type}`, file);
  });

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Upload API response error:", error);
      throw new Error(error.error || error.message || "Upload failed");
    }

    const result = await response.json();
    return result.urls;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

export function validateFile(file: File, type: "image" | "video"): boolean {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    toast({
      title: "File too large",
      description: `${file.name} exceeds 50MB limit`,
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

  if (type === "image" && !validImageTypes.includes(file.type)) {
    toast({
      title: "Invalid file type",
      description: `${file.name} is not a valid image format`,
      variant: "destructive",
    });
    return false;
  }

  if (type === "video" && !validVideoTypes.includes(file.type)) {
    toast({
      title: "Invalid file type",
      description: `${file.name} is not a valid video format`,
      variant: "destructive",
    });
    return false;
  }

  return true;
}
