import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserRole } from "@prisma/client";

export interface AgencyAgent {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    properties: number;
  };
}

export interface UseAgencyAgentsParams {
  search?: string;
  active?: boolean;
  page?: number;
  limit?: number;
}

export interface AgencyAgentsResponse {
  agents: AgencyAgent[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export function useAgencyAgents(params: UseAgencyAgentsParams = {}) {
  const { search, active, page = 1, limit = 10 } = params;

  return useQuery({
    queryKey: ["agency-agents", search, active, page, limit],
    queryFn: async (): Promise<AgencyAgentsResponse> => {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) {
        searchParams.append("search", search);
      }

      if (active !== undefined) {
        searchParams.append("active", active.toString());
      }

      const response = await fetch(`/api/agents?${searchParams}`);

      if (!response.ok) {
        throw new Error("Failed to fetch agents");
      }

      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      firstName: string;
      lastName: string;
      email: string;
    }) => {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create agent");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-agents"] });
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agentId,
      data,
    }: {
      agentId: string;
      data: { active?: boolean; firstName?: string; lastName?: string };
    }) => {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update agent");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-agents"] });
    },
  });
}
