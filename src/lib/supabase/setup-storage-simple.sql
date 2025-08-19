-- Create storage buckets for property media (if they don't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('property-images', 'property-images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']),
  ('property-videos', 'property-videos', true, 52428800, ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov']),
  ('landing-images', 'landing-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'])
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own property videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all property videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own property videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own property videos" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can manage landing images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view landing images" ON storage.objects;

-- Set up RLS policies for property-images bucket
CREATE POLICY "Users can upload their own property images" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view all property images" 
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'property-images');

CREATE POLICY "Users can update their own property images" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own property images" 
ON storage.objects FOR DELETE 
TO authenticated
USING (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Set up RLS policies for property-videos bucket
CREATE POLICY "Users can upload their own property videos" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'property-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view all property videos" 
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'property-videos');

CREATE POLICY "Users can update their own property videos" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'property-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own property videos" 
ON storage.objects FOR DELETE 
TO authenticated
USING (
  bucket_id = 'property-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Set up RLS policies for landing-images bucket (super admin only)
CREATE POLICY "Super admins can manage landing images" 
ON storage.objects FOR ALL 
TO authenticated
USING (
  bucket_id = 'landing-images' 
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'SUPER_ADMIN'
  )
);

CREATE POLICY "Public can view landing images" 
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'landing-images'); 