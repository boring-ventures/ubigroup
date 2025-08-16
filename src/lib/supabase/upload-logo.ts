import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "logos";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

export async function uploadLogo(file: File, agencyId: string) {
  // Validate file before upload
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      "Invalid file type. Please upload a JPEG, PNG, GIF or WebP image."
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      "File size too large. Please upload an image smaller than 2MB."
    );
  }

  try {
    const supabase = createClientComponentClient();

    // Upload the file to Supabase storage - WebP conversion will happen on server side
    const fileExt = file.name.split(".").pop();
    const fileName = `agency-${agencyId}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("Error uploading logo:", error);
    throw error;
  }
} 