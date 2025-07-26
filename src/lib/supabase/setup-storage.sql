-- Create storage buckets for property media
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('property-images', 'property-images', true),
  ('property-videos', 'property-videos', true);

-- Set up RLS policies for property-images bucket
CREATE POLICY "Users can upload their own property images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view all property images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'property-images');

CREATE POLICY "Users can update their own property images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own property images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Set up RLS policies for property-videos bucket
CREATE POLICY "Users can upload their own property videos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'property-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view all property videos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'property-videos');

CREATE POLICY "Users can update their own property videos" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'property-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own property videos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'property-videos' AND auth.uid()::text = (storage.foldername(name))[1]); 