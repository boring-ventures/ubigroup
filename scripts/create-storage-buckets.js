const { createClient } = require("@supabase/supabase-js");

// Load environment variables
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables:");
  console.error("- NEXT_PUBLIC_SUPABASE_URL");
  console.error("- SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createStorageBuckets() {
  try {
    console.log("Creating Supabase storage buckets...");

    // Create property-images bucket
    const { error: imagesError } = await supabase.storage.createBucket(
      "property-images",
      {
        public: true,
        fileSizeLimit: 52428800, // 50MB (Supabase Free tier limit)
        allowedMimeTypes: [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
          "image/jpg",
        ],
      }
    );

    if (imagesError) {
      if (imagesError.message.includes("already exists")) {
        console.log("✅ property-images bucket already exists");
      } else {
        console.error("Error creating property-images bucket:", imagesError);
      }
    } else {
      console.log("✅ property-images bucket created successfully");
    }

    // Create property-videos bucket
    const { error: videosError } = await supabase.storage.createBucket(
      "property-videos",
      {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          "video/mp4",
          "video/webm",
          "video/ogg",
          "video/avi",
          "video/mov",
        ],
      }
    );

    if (videosError) {
      if (videosError.message.includes("already exists")) {
        console.log("✅ property-videos bucket already exists");
      } else {
        console.error("Error creating property-videos bucket:", videosError);
      }
    } else {
      console.log("✅ property-videos bucket created successfully");
    }

    // Create landing-images bucket
    const { error: landingImagesError } = await supabase.storage.createBucket(
      "landing-images",
      {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
        ],
      }
    );

    if (landingImagesError) {
      if (landingImagesError.message.includes("already exists")) {
        console.log("✅ landing-images bucket already exists");
      } else {
        console.error(
          "Error creating landing-images bucket:",
          landingImagesError
        );
      }
    } else {
      console.log("✅ landing-images bucket created successfully");
    }

    console.log("✅ Storage buckets setup completed!");
  } catch (error) {
    console.error("Failed to create storage buckets:", error);
    process.exit(1);
  }
}

createStorageBuckets();
