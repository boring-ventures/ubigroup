import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth/server-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  try {
    console.log("Upload API: Starting file upload process");

    // Authenticate user
    const { user, error: authError } = await authenticateUser();
    if (!user) {
      console.error("Upload API: Authentication failed:", authError);
      return NextResponse.json(
        { error: authError || "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Upload API: User authenticated:", user.id);

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const formData = await request.formData();
    const files = formData
      .getAll("images")
      .concat(formData.getAll("videos")) as File[];

    console.log("Upload API: Found files:", files.length);

    if (files.length === 0) {
      console.error("Upload API: No files provided");
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      console.log(
        `Upload API: Processing file ${file.name}, size: ${file.size}`
      );

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        console.error(`Upload API: File ${file.name} exceeds size limit`);
        return NextResponse.json(
          { error: `File ${file.name} exceeds 50MB limit` },
          { status: 400 }
        );
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const fileExtension = file.name.split(".").pop();
      const fileName = `${timestamp}-${randomId}.${fileExtension}`;

      // Determine storage bucket based on file type
      const bucket = file.type.startsWith("image/")
        ? "property-images"
        : "property-videos";
      const filePath = `${user.id}/${fileName}`;

      console.log(
        `Upload API: Uploading to bucket ${bucket}, path: ${filePath}`
      );

      // Try to upload directly first - the bucket might already exist
      let uploadResult = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      // If upload fails, try to create the bucket and upload again
      if (uploadResult.error) {
        console.log(
          `Upload API: Initial upload failed, trying to create bucket: ${bucket}`
        );

        // Try to create bucket
        const { error: createError } = await supabase.storage.createBucket(
          bucket,
          {
            public: true,
            fileSizeLimit: 52428800, // 50MB
            allowedMimeTypes: file.type.startsWith("image/")
              ? [
                  "image/jpeg",
                  "image/png",
                  "image/gif",
                  "image/webp",
                  "image/jpg",
                ]
              : [
                  "video/mp4",
                  "video/webm",
                  "video/ogg",
                  "video/avi",
                  "video/mov",
                ],
          }
        );

        if (createError) {
          console.error(
            `Upload API: Failed to create bucket ${bucket}:`,
            createError
          );
          // Continue anyway - the bucket might already exist
        } else {
          console.log(`Upload API: Successfully created bucket ${bucket}`);
        }

        // Try upload again
        uploadResult = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });
      }

      if (uploadResult.error) {
        console.error("Upload API: Upload error:", uploadResult.error);

        // Provide more specific error messages
        let errorMessage = `Failed to upload ${file.name}`;
        if (uploadResult.error.message.includes("row-level security")) {
          errorMessage = "Storage access denied. Please contact support.";
        } else if (uploadResult.error.message.includes("bucket")) {
          errorMessage = "Storage bucket not available. Please try again.";
        } else {
          errorMessage = `${errorMessage}: ${uploadResult.error.message}`;
        }

        return NextResponse.json(
          {
            error: errorMessage,
            details: uploadResult.error,
          },
          { status: 500 }
        );
      }

      console.log(
        `Upload API: File uploaded successfully:`,
        uploadResult.data?.path
      );

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        console.error("Upload API: Failed to get public URL");
        return NextResponse.json(
          {
            error: `Failed to get public URL for ${file.name}`,
          },
          { status: 500 }
        );
      }

      console.log(`Upload API: Public URL generated:`, publicUrlData.publicUrl);
      uploadedUrls.push(publicUrlData.publicUrl);
    }

    console.log(
      `Upload API: All files uploaded successfully. URLs:`,
      uploadedUrls
    );
    return NextResponse.json({ urls: uploadedUrls });
  } catch (error) {
    console.error("Upload API: Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
