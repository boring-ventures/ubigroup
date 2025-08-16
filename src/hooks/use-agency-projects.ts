import { useQuery } from "@tanstack/react-query";

export interface UseAgencyProjectsParams {
  page?: number;
  limit?: number;
  search?: string;
  agentId?: string;
}

export interface AgencyProjectsResponse {
  projects: Array<{
    id: string;
    name: string;
    description: string;
    location: string;
    propertyType: string;
    images: string[];
    createdAt: string;
    active: boolean;
    agent: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
    };
    agency: {
      id: string;
      name: string;
      logoUrl: string | null;
    };
    floors: Array<{
      id: string;
      number: number;
      name: string | null;
      quadrants: Array<{
        id: string;
        customId: string;
        status: string;
      }>;
    }>;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function useAgencyProjects(params: UseAgencyProjectsParams = {}) {
  const { search, agentId, page = 1, limit = 10 } = params;

  return useQuery({
    queryKey: ["agency-projects", search, agentId, page, limit],
    queryFn: async (): Promise<AgencyProjectsResponse> => {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) {
        searchParams.append("search", search);
      }

      if (agentId) {
        searchParams.append("agentId", agentId);
      }

      const response = await fetch(`/api/projects?${searchParams}`);

      if (!response.ok) {
        throw new Error("Failed to fetch agency projects");
      }

      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
