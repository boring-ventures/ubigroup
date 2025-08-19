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

async function applyStoragePolicies() {
  try {
    console.log("Applying Supabase storage policies...");

    // Enable RLS on storage.objects
    const { error: rlsError } = await supabase.rpc("exec_sql", {
      sql: "ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;",
    });

    if (rlsError) {
      console.log("RLS already enabled or error:", rlsError.message);
    }

    // Drop existing policies
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Users can upload their own property images" ON storage.objects;',
      'DROP POLICY IF EXISTS "Users can view all property images" ON storage.objects;',
      'DROP POLICY IF EXISTS "Users can update their own property images" ON storage.objects;',
      'DROP POLICY IF EXISTS "Users can delete their own property images" ON storage.objects;',
      'DROP POLICY IF EXISTS "Users can upload their own property videos" ON storage.objects;',
      'DROP POLICY IF EXISTS "Users can view all property videos" ON storage.objects;',
      'DROP POLICY IF EXISTS "Users can update their own property videos" ON storage.objects;',
      'DROP POLICY IF EXISTS "Users can delete their own property videos" ON storage.objects;',
      'DROP POLICY IF EXISTS "Super admins can manage landing images" ON storage.objects;',
      'DROP POLICY IF EXISTS "Public can view landing images" ON storage.objects;',
    ];

    for (const policy of dropPolicies) {
      const { error } = await supabase.rpc("exec_sql", { sql: policy });
      if (error) {
        console.log("Policy drop error (may not exist):", error.message);
      }
    }

    // Create new policies
    const createPolicies = [
      // Property images policies
      `CREATE POLICY "Users can upload their own property images" 
       ON storage.objects FOR INSERT 
       TO authenticated
       WITH CHECK (
         bucket_id = 'property-images' 
         AND auth.uid()::text = (storage.foldername(name))[1]
       );`,

      `CREATE POLICY "Users can view all property images" 
       ON storage.objects FOR SELECT 
       TO public
       USING (bucket_id = 'property-images');`,

      `CREATE POLICY "Users can update their own property images" 
       ON storage.objects FOR UPDATE 
       TO authenticated
       USING (
         bucket_id = 'property-images' 
         AND auth.uid()::text = (storage.foldername(name))[1]
       );`,

      `CREATE POLICY "Users can delete their own property images" 
       ON storage.objects FOR DELETE 
       TO authenticated
       USING (
         bucket_id = 'property-images' 
         AND auth.uid()::text = (storage.foldername(name))[1]
       );`,

      // Property videos policies
      `CREATE POLICY "Users can upload their own property videos" 
       ON storage.objects FOR INSERT 
       TO authenticated
       WITH CHECK (
         bucket_id = 'property-videos' 
         AND auth.uid()::text = (storage.foldername(name))[1]
       );`,

      `CREATE POLICY "Users can view all property videos" 
       ON storage.objects FOR SELECT 
       TO public
       USING (bucket_id = 'property-videos');`,

      `CREATE POLICY "Users can update their own property videos" 
       ON storage.objects FOR UPDATE 
       TO authenticated
       USING (
         bucket_id = 'property-videos' 
         AND auth.uid()::text = (storage.foldername(name))[1]
       );`,

      `CREATE POLICY "Users can delete their own property videos" 
       ON storage.objects FOR DELETE 
       TO authenticated
       USING (
         bucket_id = 'property-videos' 
         AND auth.uid()::text = (storage.foldername(name))[1]
       );`,

      // Landing images policies (super admin only)
      `CREATE POLICY "Super admins can manage landing images" 
       ON storage.objects FOR ALL 
       TO authenticated
       USING (
         bucket_id = 'landing-images' 
         AND EXISTS (
           SELECT 1 FROM users 
           WHERE users.id = auth.uid() 
           AND users.role = 'SUPER_ADMIN'
         )
       );`,

      `CREATE POLICY "Public can view landing images" 
       ON storage.objects FOR SELECT 
       TO public
       USING (bucket_id = 'landing-images');`,
    ];

    for (const policy of createPolicies) {
      const { error } = await supabase.rpc("exec_sql", { sql: policy });
      if (error) {
        console.error("Policy creation error:", error.message);
      } else {
        console.log("✅ Policy created successfully");
      }
    }

    console.log("✅ Storage policies setup completed!");
  } catch (error) {
    console.error("Failed to setup storage policies:", error);
    process.exit(1);
  }
}

applyStoragePolicies();
