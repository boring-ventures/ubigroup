import { toast } from "@/components/ui/use-toast";

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function uploadFiles(
  files: File[],
  type: "images" | "videos"
): Promise<string[]> {
  if (!files || files.length === 0) {
    throw new Error("No files provided for upload");
  }

  const formData = new FormData();

  // Add files to FormData
  files.forEach((file, index) => {
    formData.append(`${type}`, file);
  });

  try {
    console.log(`Uploading ${files.length} ${type}...`);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    console.log("Upload response status:", response.status);

    if (!response.ok) {
      let errorMessage = "Upload failed";
      try {
        const errorData = await response.json();
        console.error("Upload API response error:", errorData);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (jsonError) {
        console.error("Failed to parse error response:", jsonError);
        errorMessage = `Upload failed with status ${response.status}`;
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
      title: "Upload Error",
      description: errorMessage,
      variant: "destructive",
    });

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
