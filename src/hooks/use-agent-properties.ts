import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PropertyStatus } from "@prisma/client";

export interface AgentProperty {
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
  bedrooms: number;
  bathrooms: number;
  garageSpaces: number;
  area: number;
  status: PropertyStatus;
  rejectionMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UseAgentPropertiesParams {
  status?: PropertyStatus;
  search?: string;
  page?: number;
  limit?: number;
  // New filter parameters
  locationState?: string;
  locationCity?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minSquareMeters?: number;
  maxSquareMeters?: number;
  propertyType?: string;
  transactionType?: string;
}

export interface AgentPropertiesResponse {
  properties: AgentProperty[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export function useAgentProperties(params: UseAgentPropertiesParams = {}) {
  const {
    status,
    search,
    page = 1,
    limit = 10,
    locationState,
    locationCity,
    minPrice,
    maxPrice,
    minBedrooms,
    maxBedrooms,
    minBathrooms,
    maxBathrooms,
    minSquareMeters,
    maxSquareMeters,
    propertyType,
    transactionType,
  } = params;

  return useQuery({
    queryKey: [
      "agent-properties",
      status,
      search,
      page,
      limit,
      locationState,
      locationCity,
      minPrice,
      maxPrice,
      minBedrooms,
      maxBedrooms,
      minBathrooms,
      maxBathrooms,
      minSquareMeters,
      maxSquareMeters,
      propertyType,
      transactionType,
    ],
    queryFn: async (): Promise<AgentPropertiesResponse> => {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (status) {
        searchParams.append("status", status);
      }

      if (search) {
        searchParams.append("search", search);
      }

      // Add new filter parameters
      if (locationState) {
        searchParams.append("locationState", locationState);
      }

      if (locationCity) {
        searchParams.append("locationCity", locationCity);
      }

      if (minPrice) {
        searchParams.append("minPrice", minPrice.toString());
      }

      if (maxPrice) {
        searchParams.append("maxPrice", maxPrice.toString());
      }

      if (minBedrooms) {
        searchParams.append("minBedrooms", minBedrooms.toString());
      }

      if (maxBedrooms) {
        searchParams.append("maxBedrooms", maxBedrooms.toString());
      }

      if (minBathrooms) {
        searchParams.append("minBathrooms", minBathrooms.toString());
      }

      if (maxBathrooms) {
        searchParams.append("maxBathrooms", maxBathrooms.toString());
      }

      if (minSquareMeters) {
        searchParams.append("minSquareMeters", minSquareMeters.toString());
      }

      if (maxSquareMeters) {
        searchParams.append("maxSquareMeters", maxSquareMeters.toString());
      }

      if (propertyType) {
        searchParams.append("type", propertyType);
      }

      if (transactionType) {
        searchParams.append("transactionType", transactionType);
      }

      const response = await fetch(`/api/properties?${searchParams}`);

      if (!response.ok) {
        throw new Error("Failed to fetch properties");
      }

      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useResendPropertyForApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (propertyId: string) => {
      const response = await fetch(`/api/properties/${propertyId}/resend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || "Failed to resend property for approval"
        );
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}
