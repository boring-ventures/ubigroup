# Landing Images Module Setup Guide

## Overview

This guide provides all the steps needed to set up the landing images module for super admins to manage hero section images.

## ✅ Completed Steps

### 1. Database Schema

- ✅ Added `LandingImageStatus` enum to Prisma schema
- ✅ Added `LandingImage` model to Prisma schema
- ✅ Added relationship to `User` model
- ✅ Created and applied database migration

### 2. Storage Infrastructure

- ✅ Updated storage setup SQL files
- ✅ Added `landing-images` bucket configuration
- ✅ Updated bucket creation script
- ✅ Created bucket successfully

### 3. Backend Implementation

- ✅ Created landing image upload utility
- ✅ Created validation schemas
- ✅ Created API routes for CRUD operations
- ✅ Created custom hook for state management

### 4. Frontend Implementation

- ✅ Added sidebar navigation for super admins
- ✅ Created landing images management page
- ✅ Created comprehensive management component
- ✅ Implemented full CRUD functionality

## 🔧 Manual Setup Required

### Storage Policies (Supabase Dashboard)

You need to manually apply these SQL policies in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the following SQL commands:

```sql
-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

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

-- Allow bucket creation for authenticated users
CREATE POLICY "Allow authenticated users to create buckets"
ON storage.buckets FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to view buckets
CREATE POLICY "Allow authenticated users to view buckets"
ON storage.buckets FOR SELECT
TO authenticated
USING (true);
```

## 🚀 Usage

### For Super Admins

1. **Access the Module**: Navigate to `/landing-images` in the dashboard
2. **Add Images**: Click "Agregar Imagen" to upload new hero images
3. **Manage Status**: Toggle between ACTIVE/INACTIVE to control which images are shown
4. **Edit Images**: Click the edit button to modify image details
5. **Delete Images**: Click the delete button to remove images (soft delete)

### Features

- **Image Upload**: Support for JPEG, PNG, GIF, WebP (10MB max)
- **Status Management**: ACTIVE images are shown in the hero section
- **Ordering**: Set display order for images
- **Soft Delete**: Images are marked as inactive rather than permanently deleted
- **Preview**: Image preview before upload
- **Validation**: Client and server-side validation

### API Endpoints

- `GET /api/landing-images` - List all landing images
- `POST /api/landing-images` - Create new landing image
- `GET /api/landing-images/[id]` - Get specific landing image
- `PUT /api/landing-images/[id]` - Update landing image
- `DELETE /api/landing-images/[id]` - Soft delete landing image

## 🔒 Security

- Only SUPER_ADMIN users can access the module
- Storage policies ensure only super admins can manage landing images
- Public read access for displaying images in the hero section
- Proper authentication and authorization checks

## 📁 File Structure

```
src/
├── app/
│   └── (dashboard)/
│       └── landing-images/
│           └── page.tsx                    # Main page
├── app/api/
│   └── landing-images/
│       ├── route.ts                        # List/Create
│       └── [id]/route.ts                   # Get/Update/Delete
├── components/dashboard/
│   └── landing-images-management.tsx       # Main component
├── hooks/
│   └── use-landing-images.ts               # Custom hook
├── lib/
│   ├── supabase/
│   │   └── upload-landing-image.ts         # Upload utility
│   └── validations/
│       └── landing-image.ts                # Validation schemas
└── components/sidebar/data/
    └── sidebar-data.ts                     # Navigation (updated)
```

## 🎯 Next Steps

1. **Apply Storage Policies**: Run the SQL commands in Supabase dashboard
2. **Test the Module**: Access as super admin and test all CRUD operations
3. **Integrate with Hero Section**: Update the hero component to use active landing images
4. **Add Image Optimization**: Consider adding image resizing/optimization
5. **Add Bulk Operations**: Consider adding bulk status changes

## 🐛 Troubleshooting

### Common Issues

1. **Storage Access Denied**: Ensure storage policies are applied correctly
2. **Super Admin Access**: Verify user has SUPER_ADMIN role
3. **File Size**: Ensure images are under 10MB
4. **File Type**: Ensure images are in supported formats

### Debug Commands

```bash
# Check database migration
pnpm prisma migrate status

# Regenerate Prisma client
pnpm prisma generate

# Check storage buckets
node scripts/create-storage-buckets.js
```

## 📝 Notes

- Images are stored in the `landing-images` bucket
- File size limit: 10MB per image
- Supported formats: JPEG, PNG, GIF, WebP
- Soft delete is used (sets `active: false`)
- Order field allows custom sorting
- Status field controls visibility in hero section
