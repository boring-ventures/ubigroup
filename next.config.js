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
      // Add randomuser.me for placeholder avatars
      "randomuser.me",
    ],
  },
  // ... other config options
};

module.exports = nextConfig;
