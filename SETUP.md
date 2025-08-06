# Setup Guide - Resolving Authentication Error

## Issue

You're getting the error: `AuthSessionMissingError: Auth session missing!` because the Supabase environment variables are not configured.

## Solution

### 1. Create Environment File

Create a `.env.local` file in the root directory of your project:

```bash
# Create the environment file
touch .env.local
```

### 2. Configure Supabase Environment Variables

Add the following variables to your `.env.local` file:

```env
# Supabase Project Settings
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Database URLs
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:5432/postgres"

# Storage
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=avatars

# Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select an existing one
3. Go to **Settings** > **API**
4. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Configure Database Connection

1. In your Supabase project, go to **Settings** > **Database**
2. Find the connection string in the **Connection string** section
3. Replace the placeholders in `DATABASE_URL` and `DIRECT_URL` with your actual values

### 5. Set Up Storage

1. In your Supabase project, go to **Storage**
2. Create a new bucket named `avatars`
3. Set the bucket to public (if needed for avatar access)

### 6. Initialize Database

After setting up the environment variables, run:

```bash
# Install dependencies (if not already done)
pnpm install

# Generate Prisma client
pnpm prisma generate

# Push the database schema
pnpm prisma db push
```

### 7. Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
pnpm dev
```

## Verification

After completing the setup:

1. The authentication error should be resolved
2. You should be able to access the landing page without errors
3. The "Acessar Dashboard" button should work properly

## Troubleshooting

### If you still get errors:

1. **Check environment variables**: Make sure all variables in `.env.local` are set correctly
2. **Restart the server**: Sometimes environment changes require a server restart
3. **Check Supabase project**: Ensure your Supabase project is active and accessible
4. **Database connection**: Verify the database connection strings are correct

### Common Issues:

- **Missing .env.local**: The file must be in the root directory
- **Wrong variable names**: Ensure exact variable names as shown above
- **Invalid credentials**: Double-check your Supabase project URL and keys
- **Database not initialized**: Run `pnpm prisma db push` after setting up credentials

## Next Steps

Once the environment is configured:

1. You can create user accounts through the sign-up process
2. The dashboard will be accessible for authenticated users
3. Property management features will be available for agency users

For more detailed setup instructions, see the main [README.md](./README.md) file.
