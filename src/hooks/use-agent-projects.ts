import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PropertyStatus } from "@prisma/client";

export interface AgentProject {
  id: string;
  name: string;
  description: string;
  location: string;
  images: string[];
  brochureUrl: string | null;
  googleMapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  status: PropertyStatus;
  rejectionMessage: string | null;
  createdAt: string;
  updatedAt: string;
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
}

export interface UseAgentProjectsParams {
  page?: number;
  limit?: number;
  status?: PropertyStatus;
}

export interface AgentProjectsResponse {
  projects: AgentProject[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export function useAgentProjects(params: UseAgentProjectsParams = {}) {
  const { page = 1, limit = 10, status } = params;

  return useQuery({
    queryKey: ["agent-projects", page, limit, status],
    queryFn: async (): Promise<AgentProjectsResponse> => {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (status) {
        searchParams.append("status", status);
      }

      const response = await fetch(`/api/projects?${searchParams}`);

      if (!response.ok) {
        throw new Error("Failed to fetch agent projects");
      }

      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useResendProjectForApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch(`/api/projects/${projectId}/resend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to resend project for approval");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}




