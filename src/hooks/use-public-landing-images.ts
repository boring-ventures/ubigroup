import { useState, useEffect } from "react";

export interface PublicLandingImage {
  id: string;
  title: string | null;
  description: string | null;
  imageUrl: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

// Utility function to preload images
const preloadImages = (imageUrls: string[]) => {
  imageUrls.forEach((url) => {
    const img = new Image();
    img.src = url;
  });
};

export function usePublicLandingImages() {
  const [landingImages, setLandingImages] = useState<PublicLandingImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLandingImages = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/public/landing-images");

      if (!response.ok) {
        throw new Error("Failed to fetch landing images");
      }

      const data = await response.json();
      setLandingImages(data);

      // Preload the database images for smooth transitions
      if (data.length > 0) {
        const imageUrls = data.map((img: PublicLandingImage) => img.imageUrl);
        preloadImages(imageUrls);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLandingImages();
  }, []);

  return {
    landingImages,
    loading,
    error,
    refetch: fetchLandingImages,
  };
}
