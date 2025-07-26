import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "./use-current-user";

// Define the metrics types based on user role
interface AgentProperties {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

interface RecentProperty {
  id: string;
  title: string;
  status: string;
  price: number;
  transactionType: string;
  createdAt: string;
}

interface DashboardMetrics {
  // Agent-specific metrics
  agentProperties?: AgentProperties;
  recentProperties?: RecentProperty[];
  averagePropertyPrice?: number;

  // Agency Admin metrics
  agencyInfo?: {
    name: string;
    logoUrl?: string;
  };
  agentStats?: {
    totalAgents: number;
    activeAgents: number;
  };
  propertyStats?: {
    totalProperties: number;
    approvedProperties: number;
    pendingProperties: number;
    rejectedProperties: number;
    approvalRate: number;
  };
  topAgents?: Array<{
    id: string;
    name: string;
    propertiesCount: number;
    active: boolean;
  }>;

  // Super Admin metrics
  platformStats?: {
    totalAgencies: number;
    activeAgencies: number;
    totalUsers: number;
    totalAgents: number;
    totalAgencyAdmins: number;
  };
  recentActivities?: Array<{
    type: string;
    id: string;
    title: string;
    agent: string;
    agency: string;
    status: string;
    createdAt: string;
  }>;
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

      const data = await response.json();

      // Transform the API response based on user role
      if (profile?.role === "AGENT") {
        return {
          agentProperties: {
            total: data.metrics.personalStats?.totalProperties || 0,
            approved: data.metrics.personalStats?.approvedProperties || 0,
            pending: data.metrics.personalStats?.pendingProperties || 0,
            rejected: data.metrics.personalStats?.rejectedProperties || 0,
          },
          recentProperties: data.metrics.recentProperties || [],
          averagePropertyPrice:
            data.metrics.performanceInsights?.averagePropertyPrice || 0,
        };
      }

      // Return the metrics as-is for other roles
      return data.metrics;
    },
    enabled: !!profile?.role,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
}
