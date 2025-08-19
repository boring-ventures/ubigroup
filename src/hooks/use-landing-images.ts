import { useState, useEffect, useCallback } from "react";
import { useCurrentUser } from "./use-current-user";

export interface LandingImage {
  id: string;
  title: string | null;
  description: string | null;
  imageUrl: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
  active: boolean;
  createdBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export interface CreateLandingImageData {
  title: string;
  description?: string;
  imageUrl: string;
  status?: "ACTIVE" | "INACTIVE";
}

export interface UpdateLandingImageData {
  title?: string;
  description?: string;
  imageUrl?: string;
  status?: "ACTIVE" | "INACTIVE";
}

export function useLandingImages() {
  const [landingImages, setLandingImages] = useState<LandingImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { profile: user, isLoading: userLoading } = useCurrentUser();

  const fetchLandingImages = useCallback(
    async (filters?: { status?: string; active?: boolean }) => {
      try {
        setLoading(true);
        setError(null);

        console.log("Fetching landing images...");
        const params = new URLSearchParams();
        if (filters?.status) params.append("status", filters.status);
        if (filters?.active !== undefined)
          params.append("active", filters.active.toString());

        const response = await fetch(
          `/api/landing-images?${params.toString()}`
        );
        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error:", errorText);
          throw new Error(`Failed to fetch landing images: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched data:", data);
        setLandingImages(data);
      } catch (err) {
        console.error("Error in fetchLandingImages:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createLandingImage = useCallback(
    async (data: CreateLandingImageData): Promise<LandingImage> => {
      const response = await fetch("/api/landing-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create landing image");
      }

      const newImage = await response.json();
      setLandingImages((prev) => [...prev, newImage]);
      return newImage;
    },
    []
  );

  const updateLandingImage = useCallback(
    async (id: string, data: UpdateLandingImageData): Promise<LandingImage> => {
      const response = await fetch(`/api/landing-images/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update landing image");
      }

      const updatedImage = await response.json();
      setLandingImages((prev) =>
        prev.map((img) => (img.id === id ? updatedImage : img))
      );
      return updatedImage;
    },
    []
  );

  const deleteLandingImage = useCallback(async (id: string): Promise<void> => {
    console.log("Sending delete request for image ID:", id);
    const response = await fetch(`/api/landing-images/${id}`, {
      method: "DELETE",
    });

    console.log("Delete response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Delete error response:", errorData);
      throw new Error(errorData.error || "Failed to delete landing image");
    }

    console.log("Removing image from local state:", id);
    setLandingImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      console.log("Images after deletion:", filtered.length);
      return filtered;
    });
  }, []);

  const toggleImageStatus = useCallback(
    async (id: string): Promise<LandingImage> => {
      const image = landingImages.find((img) => img.id === id);
      if (!image) {
        throw new Error("Image not found");
      }

      const newStatus = image.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      return updateLandingImage(id, { status: newStatus });
    },
    [landingImages, updateLandingImage]
  );

  useEffect(() => {
    console.log(
      "useEffect triggered, user:",
      user,
      "userLoading:",
      userLoading,
      "isInitialized:",
      isInitialized
    );

    // If user data is still loading, don't do anything yet
    if (userLoading) {
      console.log("User data is still loading...");
      return;
    }

    // If we've already initialized and have data, don't refetch
    if (isInitialized && landingImages.length > 0) {
      console.log("Already initialized with data, skipping refetch");
      return;
    }

    if (user) {
      console.log("User role:", user.role);
      if (user.role === "SUPER_ADMIN") {
        console.log("User is super admin, fetching images...");
        fetchLandingImages().then(() => {
          setIsInitialized(true);
        });
      } else {
        // If user is not super admin, stop loading and show error
        console.log("User is not super admin");
        setLoading(false);
        setError("Access denied. Super admin role required.");
        setIsInitialized(true);
      }
    } else {
      console.log("No user found");
      setLoading(false);
      setError("Please sign in to access this page.");
      setIsInitialized(true);
    }
  }, [
    user,
    userLoading,
    isInitialized,
    landingImages.length,
    fetchLandingImages,
  ]);

  return {
    landingImages,
    loading,
    error,
    fetchLandingImages,
    createLandingImage,
    updateLandingImage,
    deleteLandingImage,
    toggleImageStatus,
  };
}
