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
import {
  Home,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  DollarSign,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function AgentDashboard() {
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

  const properties = metrics?.agentProperties;
  const approvalRate = properties?.total
    ? Math.round((properties.approved / properties.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
          <p className="text-muted-foreground">
            Track your property listings and performance
          </p>
        </div>
        <Button asChild>
          <Link href="/properties/create">
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Link>
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Total Properties"
          value={properties?.total || 0}
          description="All your listings"
          icon={Home}
        />
        <MetricsCard
          title="Approved"
          value={properties?.approved || 0}
          description={`${approvalRate}% approval rate`}
          icon={CheckCircle}
        />
        <MetricsCard
          title="Pending Review"
          value={properties?.pending || 0}
          description="Awaiting approval"
          icon={Clock}
        />
        <MetricsCard
          title="Average Price"
          value={
            metrics?.averagePropertyPrice
              ? `$${metrics.averagePropertyPrice.toLocaleString()}`
              : "$0"
          }
          description="Property listing average"
          icon={DollarSign}
        />
      </div>

      {/* Quick Actions and Status Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your property listings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start">
              <Link href="/properties/create">
                <Plus className="mr-2 h-4 w-4" />
                Create New Property
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/my-properties">
                <Home className="mr-2 h-4 w-4" />
                View All Properties
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/properties/pending">
                <Clock className="mr-2 h-4 w-4" />
                Pending Properties
                {(properties?.pending || 0) > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {properties?.pending}
                  </Badge>
                )}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Property Status Overview</CardTitle>
            <CardDescription>Current status of your listings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Approved</span>
              </div>
              <span className="text-sm font-medium">
                {properties?.approved || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Pending</span>
              </div>
              <span className="text-sm font-medium">
                {properties?.pending || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">Rejected</span>
              </div>
              <span className="text-sm font-medium">
                {properties?.rejected || 0}
              </span>
            </div>
            {(properties?.total || 0) > 0 && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Approval Rate
                  </span>
                  <span className="text-sm font-medium">{approvalRate}%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Properties */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Properties</CardTitle>
          <CardDescription>Your latest property submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics?.recentProperties && metrics.recentProperties.length > 0 ? (
            <div className="space-y-3">
              {metrics.recentProperties.slice(0, 5).map((property) => (
                <div
                  key={property.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{property.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Created{" "}
                      {new Date(property.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        property.status === "APPROVED"
                          ? "default"
                          : property.status === "PENDING"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {property.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Home className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">
                No properties yet
              </p>
              <Button asChild className="mt-4">
                <Link href="/properties/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Property
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
