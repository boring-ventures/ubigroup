import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { authenticateUser } from "@/lib/auth/rbac";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error: authError } = await authenticateUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || "Unauthorized" },
        { status: 401 }
      );
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const formData = await request.formData();
    const files = formData
      .getAll("images")
      .concat(formData.getAll("videos")) as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
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

      // Check if bucket exists, create if it doesn't
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some((b) => b.id === bucket);

      if (!bucketExists) {
        console.log(`Creating bucket: ${bucket}`);
        const { error: createError } = await supabase.storage.createBucket(
          bucket,
          {
            public: true,
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
          console.error(`Failed to create bucket ${bucket}:`, createError);
          return NextResponse.json(
            {
              error: `Failed to create storage bucket: ${createError.message}`,
            },
            { status: 500 }
          );
        }
      }

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
          {
            error: `Failed to upload ${file.name}: ${error.message}`,
            details: error,
          },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrlData.publicUrl);
    }

    return NextResponse.json({ urls: uploadedUrls });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
