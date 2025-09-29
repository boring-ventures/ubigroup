import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PropertyStatus } from "@prisma/client";

export interface PendingProject {
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
  agent: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
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
}

export interface UsePendingProjectsParams {
  page?: number;
  limit?: number;
  agencyId?: string;
}

export interface PendingProjectsResponse {
  projects: PendingProject[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export function usePendingProjects(params: UsePendingProjectsParams = {}) {
  const { page = 1, limit = 10, agencyId } = params;

  return useQuery({
    queryKey: ["pending-projects", page, limit, agencyId],
    queryFn: async (): Promise<PendingProjectsResponse> => {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (agencyId) {
        searchParams.append("agencyId", agencyId);
      }

      const response = await fetch(`/api/projects/approve?${searchParams}`);

      if (!response.ok) {
        throw new Error("Failed to fetch pending projects");
      }

      return response.json();
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useUpdateProjectStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      status,
      rejectionMessage,
    }: {
      projectId: string;
      status: "APPROVED" | "REJECTED";
      rejectionMessage?: string;
    }) => {
      const response = await fetch("/api/projects/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: projectId,
          status,
          rejectionMessage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update project status");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["agency-projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
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
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["agency-projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}

