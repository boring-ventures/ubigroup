import { useQuery } from "@tanstack/react-query";
import { PropertyStatus } from "@prisma/client";

export interface AgencyProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  exchangeRate: number | null;
  type: string;
  transactionType: string;
  address: string | null;
  locationCity: string;
  locationState: string;
  locationNeigh: string;
  bedrooms: number;
  bathrooms: number;
  squareMeters: number;
  status: PropertyStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  agent: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  };
}

export interface UseAgencyPropertiesParams {
  status?: PropertyStatus;
  search?: string;
  agentId?: string;
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

export interface AgencyPropertiesResponse {
  properties: AgencyProperty[];
  totalCount: number;
  hasMore: boolean;
  pagination: {
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
  };
}

export function useAgencyProperties(params: UseAgencyPropertiesParams = {}) {
  const {
    status,
    search,
    agentId,
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
      "agency-properties",
      status,
      search,
      agentId,
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
    queryFn: async (): Promise<AgencyPropertiesResponse> => {
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

      if (agentId) {
        searchParams.append("agentId", agentId);
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
        throw new Error("Failed to fetch agency properties");
      }

      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
