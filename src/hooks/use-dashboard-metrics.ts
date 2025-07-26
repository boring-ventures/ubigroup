import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "./use-current-user";

export interface DashboardMetrics {
  // Super Admin metrics
  totalAgencies?: number;
  totalUsers?: number;
  totalAgents?: number;
  totalProperties?: number;
  approvalRate?: number;
  recentActivities?: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;

  // Agency Admin metrics
  agencyInfo?: {
    name: string;
    totalAgents: number;
    activeAgents: number;
  };
  agencyProperties?: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  topAgents?: Array<{
    id: string;
    name: string;
    propertyCount: number;
  }>;
  recentProperties?: Array<{
    id: string;
    title: string;
    agentName: string;
    status: string;
    createdAt: string;
  }>;

  // Agent metrics
  agentProperties?: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  averagePropertyPrice?: number;
  totalViews?: number;
}

export function useDashboardMetrics() {
  const { profile } = useCurrentUser();

  return useQuery({
    queryKey: ["dashboard-metrics", profile?.role],
    queryFn: async (): Promise<DashboardMetrics> => {
      const response = await fetch("/api/metrics");

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard metrics");
      }

      return response.json();
    },
    enabled: !!profile?.role,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
}
