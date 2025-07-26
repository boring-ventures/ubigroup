import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Agency {
  id: string;
  name: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UpdateAgencyProfileData {
  name?: string;
  logoUrl?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

// Fetch agency profile for the current Agency Admin
export function useAgencyProfile() {
  return useQuery({
    queryKey: ["agencyProfile"],
    queryFn: async (): Promise<Agency> => {
      const response = await fetch("/api/profile/agency");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch agency profile");
      }

      const data = await response.json();
      return data.agency;
    },
  });
}

// Update agency profile for the current Agency Admin
export function useUpdateAgencyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateAgencyProfileData): Promise<Agency> => {
      const response = await fetch("/api/profile/agency", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update agency profile");
      }

      const result = await response.json();
      return result.agency;
    },
    onSuccess: (updatedAgency) => {
      // Update the cached agency profile
      queryClient.setQueryData(["agencyProfile"], updatedAgency);

      // Invalidate related queries that might show agency data
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
    },
  });
}
