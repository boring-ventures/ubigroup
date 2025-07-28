import { useQuery } from "@tanstack/react-query";
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
  area: number;
  status: PropertyStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UseAgentPropertiesParams {
  status?: PropertyStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AgentPropertiesResponse {
  properties: AgentProperty[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export function useAgentProperties(params: UseAgentPropertiesParams = {}) {
  const { status, search, page = 1, limit = 10 } = params;

  return useQuery({
    queryKey: ["agent-properties", status, search, page, limit],
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

      const response = await fetch(`/api/properties?${searchParams}`);

      if (!response.ok) {
        throw new Error("Failed to fetch properties");
      }

      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
