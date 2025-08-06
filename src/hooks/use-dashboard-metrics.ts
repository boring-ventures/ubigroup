import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "./use-current-user";

// Define the metrics types based on user role
interface AgentProperties {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

interface PersonalStats {
  totalProperties: number;
  approvedProperties: number;
  pendingProperties: number;
  rejectedProperties: number;
  approvalRate: number;
  totalViews: number;
}

interface PerformanceInsights {
  averageApprovalTime: string;
  mostPopularPropertyType: string;
  averagePropertyPrice: number;
}

interface RecentProperty {
  id: string;
  title: string;
  status: string;
  price: number;
  transactionType: string;
  createdAt: string;
  agentName?: string; // For Agency Admin view
}

interface TopAgent {
  id: string;
  name: string;
  propertyCount: number; // Changed from propertiesCount to match component expectation
}

interface ApiAgent {
  id: string;
  name: string;
  propertiesCount: number;
}

interface ApiProperty {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  agent: string;
}

interface ApiActivity {
  id: string;
  title: string;
  agent: string;
  agency: string;
  status: string;
  createdAt: string;
}

interface DashboardMetrics {
  // Agent-specific metrics
  agentProperties?: AgentProperties;
  personalStats?: PersonalStats;
  performanceInsights?: PerformanceInsights;
  recentProperties?: RecentProperty[];
  averagePropertyPrice?: number;

  // Agency Admin metrics
  agencyInfo?: {
    name: string;
    logoUrl?: string;
    totalAgents: number;
    activeAgents: number;
  };
  agencyProperties?: AgentProperties; // This is what the component expects
  topAgents?: TopAgent[];

  // Super Admin metrics
  totalAgencies?: number;
  totalUsers?: number;
  totalProperties?: number;
  approvalRate?: number;
  recentActivities?: Array<{
    id: string;
    description: string;
    timestamp: string;
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
      const apiMetrics = data.metrics;

      // Transform the API response based on user role
      if (profile?.role === "AGENT") {
        return {
          personalStats: {
            totalProperties: apiMetrics.personalStats?.totalProperties || 0,
            approvedProperties:
              apiMetrics.personalStats?.approvedProperties || 0,
            pendingProperties: apiMetrics.personalStats?.pendingProperties || 0,
            rejectedProperties:
              apiMetrics.personalStats?.rejectedProperties || 0,
            approvalRate: apiMetrics.personalStats?.approvalRate || 0,
            totalViews: apiMetrics.personalStats?.totalViews || 0,
          },
          performanceInsights: {
            averageApprovalTime:
              apiMetrics.performanceInsights?.averageApprovalTime || "0 days",
            mostPopularPropertyType:
              apiMetrics.performanceInsights?.mostPopularPropertyType ||
              "APARTMENT",
            averagePropertyPrice:
              apiMetrics.performanceInsights?.averagePropertyPrice || 0,
          },
          recentProperties: apiMetrics.recentProperties || [],
          averagePropertyPrice:
            apiMetrics.performanceInsights?.averagePropertyPrice || 0,
        };
      }

      if (profile?.role === "AGENCY_ADMIN") {
        return {
          agencyInfo: {
            name: apiMetrics.agencyInfo?.name || "Agency",
            logoUrl: apiMetrics.agencyInfo?.logoUrl,
            totalAgents: apiMetrics.agentStats?.totalAgents || 0,
            activeAgents: apiMetrics.agentStats?.activeAgents || 0,
          },
          agencyProperties: {
            total: apiMetrics.propertyStats?.totalProperties || 0,
            approved: apiMetrics.propertyStats?.approvedProperties || 0,
            pending: apiMetrics.propertyStats?.pendingProperties || 0,
            rejected: apiMetrics.propertyStats?.rejectedProperties || 0,
          },
          topAgents: (apiMetrics.topAgents || []).map((agent: ApiAgent) => ({
            id: agent.id,
            name: agent.name,
            propertyCount: agent.propertiesCount || 0,
          })),
          recentProperties: (apiMetrics.recentProperties || []).map(
            (property: ApiProperty) => ({
              id: property.id,
              title: property.title,
              status: property.status,
              price: 0, // Not available in agency view
              transactionType: "SALE", // Default
              createdAt: property.createdAt,
              agentName: property.agent,
            })
          ),
        };
      }

      if (profile?.role === "SUPER_ADMIN") {
        return {
          totalAgencies: apiMetrics.platformStats?.totalAgencies || 0,
          totalUsers: apiMetrics.platformStats?.totalUsers || 0,
          totalProperties: apiMetrics.propertyStats?.totalProperties || 0,
          approvalRate: apiMetrics.propertyStats?.approvalRate || 0,
          recentActivities: (apiMetrics.recentActivities || []).map(
            (activity: ApiActivity) => ({
              id: activity.id,
              description: `Property "${activity.title}" by ${activity.agent} (${activity.agency}) - ${activity.status}`,
              timestamp: activity.createdAt,
            })
          ),
        };
      }

      // Return empty metrics if role is not recognized
      return {};
    },
    enabled: !!profile?.role,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
}
