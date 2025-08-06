/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      // Add your Supabase project domain
      "swfgvfhpmicwptupjyko.supabase.co",
      "xqakfzhkeiongvzgbhji.supabase.co",
      "erbemjrbtyxryzdiqtnl.supabase.co",
      // Add Unsplash for placeholder images
      "images.unsplash.com",
    ],
  },
  // ... other config options
};

module.exports = nextConfig;
