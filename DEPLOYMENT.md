# Ubigroup Platform - Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Supabase Project**: Ensure your Supabase project is set up and running
3. **GitHub Repository**: Your code should be in a GitHub repository

## Step 1: Prepare Your Environment Variables

Before deploying, you need to set up your environment variables in Vercel. You'll need the following variables:

### Required Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Database Configuration
DATABASE_URL=your-supabase-database-url
DIRECT_URL=your-supabase-direct-database-url

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=avatars

# Optional
NEXT_PUBLIC_WHATSAPP_NUMBER=+59170000000
```

### How to Get Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** > **API**
4. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### Database URLs

1. In your Supabase project, go to **Settings** > **Database**
2. Find the connection strings in the **Connection string** section
3. Use the **URI** format for both `DATABASE_URL` and `DIRECT_URL`

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. **Connect Repository**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Project**:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `.next` (should auto-detect)

3. **Add Environment Variables**:
   - In the project settings, go to **Environment Variables**
   - Add all the variables listed above
   - Make sure to set them for **Production**, **Preview**, and **Development**

4. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables**:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add DATABASE_URL
   vercel env add DIRECT_URL
   vercel env add NEXT_PUBLIC_APP_URL
   vercel env add NEXT_PUBLIC_SITE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET
   ```

## Step 3: Database Setup

After deployment, you need to set up your database:

1. **Run Database Migrations**:
   ```bash
   # Connect to your Vercel deployment
   vercel env pull .env.local
   
   # Run migrations
   npx prisma db push
   ```

2. **Seed Database** (if needed):
   ```bash
   npx prisma db seed
   ```

## Step 4: Configure Custom Domain (Optional)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Domains**
3. Add your custom domain
4. Update your environment variables with the new domain:
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_SITE_URL`

## Step 5: Verify Deployment

1. **Check Build Logs**: Ensure the build completed successfully
2. **Test Authentication**: Try signing up/signing in
3. **Test Database Operations**: Create a property or project
4. **Test File Uploads**: Upload an avatar or logo
5. **Check API Routes**: Verify all API endpoints work

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check that all environment variables are set
   - Ensure Prisma client is generated (`prisma generate`)
   - Verify database connection strings

2. **Database Connection Issues**:
   - Check `DATABASE_URL` and `DIRECT_URL` are correct
   - Ensure Supabase project is active
   - Verify database migrations are applied

3. **Authentication Issues**:
   - Verify Supabase credentials are correct
   - Check that Supabase Auth is enabled
   - Ensure redirect URLs are configured in Supabase

4. **File Upload Issues**:
   - Verify Supabase Storage is set up
   - Check storage bucket permissions
   - Ensure storage bucket exists

### Environment Variable Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `DATABASE_URL`
- [ ] `DIRECT_URL`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`

## Post-Deployment

1. **Monitor Performance**: Use Vercel Analytics
2. **Set Up Monitoring**: Configure error tracking
3. **Backup Strategy**: Set up database backups in Supabase
4. **Security**: Review and update security headers
5. **SEO**: Configure meta tags and sitemap

## Support

If you encounter issues:

1. Check the [Vercel Documentation](https://vercel.com/docs)
2. Review [Supabase Documentation](https://supabase.com/docs)
3. Check build logs in Vercel dashboard
4. Verify environment variables are correctly set
