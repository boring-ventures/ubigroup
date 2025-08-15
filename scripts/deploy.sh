#!/bin/bash

# Ubigroup Platform - Quick Deploy Script
# This script helps you deploy to Vercel with proper configuration

echo "🚀 Starting Ubigroup Platform Deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  Warning: .env.local not found!"
    echo "Please create .env.local with your environment variables before deploying."
    echo "See DEPLOYMENT.md for required variables."
    exit 1
fi

# Build the project locally to check for errors
echo "🔨 Building project locally..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix the errors before deploying."
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Set up environment variables in Vercel dashboard"
echo "2. Run database migrations: npx prisma db push"
echo "3. Test your deployment"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
