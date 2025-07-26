"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricsCard } from "./metrics-card";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { Building2, Users, Home, TrendingUp, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function SuperAdminDashboard() {
  const { data: metrics, isLoading, error } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load dashboard metrics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Platform overview and system management
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Total Agencies"
          value={metrics?.totalAgencies || 0}
          description="Active agencies on platform"
          icon={Building2}
        />
        <MetricsCard
          title="Total Users"
          value={metrics?.totalUsers || 0}
          description="Platform-wide users"
          icon={Users}
        />
        <MetricsCard
          title="Total Properties"
          value={metrics?.totalProperties || 0}
          description="All property listings"
          icon={Home}
        />
        <MetricsCard
          title="Approval Rate"
          value={`${metrics?.approvalRate || 0}%`}
          description="Property approval success"
          icon={TrendingUp}
        />
      </div>

      {/* Management Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start">
              <Link href="/agencies">
                <Building2 className="mr-2 h-4 w-4" />
                Manage Agencies
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/users">
                <Users className="mr-2 h-4 w-4" />
                View All Users
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/all-properties">
                <Home className="mr-2 h-4 w-4" />
                Review Properties
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activities
            </CardTitle>
            <CardDescription>Latest platform activities</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics?.recentActivities &&
            metrics.recentActivities.length > 0 ? (
              <div className="space-y-3">
                {metrics.recentActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No recent activities
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
