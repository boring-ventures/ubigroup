import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PropertyStatus } from "@prisma/client";

export interface PendingProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  exchangeRate: number | null;
  propertyType: string;
  transactionType: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  features: string[];
  images: string[];
  status: PropertyStatus;
  createdAt: string;
  updatedAt: string;
  agent: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

export interface UsePendingPropertiesParams {
  page?: number;
  limit?: number;
  agencyId?: string;
}

export interface PendingPropertiesResponse {
  properties: PendingProperty[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export function usePendingProperties(params: UsePendingPropertiesParams = {}) {
  const { page = 1, limit = 10, agencyId } = params;

  return useQuery({
    queryKey: ["pending-properties", page, limit, agencyId],
    queryFn: async (): Promise<PendingPropertiesResponse> => {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (agencyId) {
        searchParams.append("agencyId", agencyId);
      }

      const response = await fetch(`/api/properties/approve?${searchParams}`);

      if (!response.ok) {
        throw new Error("Failed to fetch pending properties");
      }

      return response.json();
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useUpdatePropertyStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      propertyId,
      status,
      rejectionReason,
    }: {
      propertyId: string;
      status: "APPROVED" | "REJECTED";
      rejectionReason?: string;
    }) => {
      const response = await fetch("/api/properties/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: propertyId,
          status,
          rejectionReason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update property status");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-properties"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["agency-properties"] });
    },
  });
}
