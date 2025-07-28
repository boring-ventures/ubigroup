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
    whatsapp: string | null;
  };
}

export interface UseAgencyPropertiesParams {
  status?: PropertyStatus;
  search?: string;
  agentId?: string;
  page?: number;
  limit?: number;
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
  const { status, search, agentId, page = 1, limit = 10 } = params;

  return useQuery({
    queryKey: ["agency-properties", status, search, agentId, page, limit],
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

      const response = await fetch(`/api/properties?${searchParams}`);

      if (!response.ok) {
        throw new Error("Failed to fetch agency properties");
      }

      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
