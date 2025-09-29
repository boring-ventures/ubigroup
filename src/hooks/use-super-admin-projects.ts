import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PropertyStatus } from "@prisma/client";

export interface SuperAdminProject {
  id: string;
  name: string;
  description: string;
  location: string;
  status: PropertyStatus;
  rejectionMessage?: string;
  createdAt: string;
  updatedAt: string;
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
  floors: {
    id: string;
    name: string;
    quadrants: {
      id: string;
      name: string;
      type: string;
      status: string;
    }[];
  }[];
}

export interface UseSuperAdminProjectsParams {
  page?: number;
  limit?: number;
  search?: string;
  agencyId?: string;
  agentId?: string;
  status?: PropertyStatus;
}

export interface SuperAdminProjectsResponse {
  projects: SuperAdminProject[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function useSuperAdminProjects(params: UseSuperAdminProjectsParams = {}) {
  const {
    page = 1,
    limit = 20,
    search,
    agencyId,
    agentId,
    status,
  } = params;

  return useQuery({
    queryKey: [
      "super-admin-projects",
      page,
      limit,
      search,
      agencyId,
      agentId,
      status,
    ],
    queryFn: async (): Promise<SuperAdminProjectsResponse> => {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) {
        searchParams.append("search", search);
      }

      if (agencyId) {
        searchParams.append("agencyId", agencyId);
      }

      if (agentId) {
        searchParams.append("agentId", agentId);
      }

      if (status) {
        searchParams.append("status", status);
      }

      const response = await fetch(`/api/projects?${searchParams}`);

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      return response.json();
    },
  });
}

// Approve project mutation
export function useApproveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch(`/api/projects/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to approve project");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-projects"] });
    },
  });
}

// Reject project mutation
export function useRejectProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      rejectionMessage,
    }: {
      projectId: string;
      rejectionMessage?: string;
    }) => {
      const response = await fetch(`/api/projects/${projectId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rejectionMessage }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reject project");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-projects"] });
    },
  });
}

// Delete project mutation
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete project");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-projects"] });
    },
  });
}

