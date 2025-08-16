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
import { Users, Home, Clock, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function AgencyAdminDashboard() {
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
          <div className="text-center">
            <p className="text-destructive mb-4">
              Failed to load dashboard metrics
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {error.message ||
                "There was an error loading your dashboard data"}
            </p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const agencyProperties = metrics?.agencyProperties;
  const approvalRate = agencyProperties?.total
    ? Math.round((agencyProperties.approved / agencyProperties.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Panel de Agencia
          </h1>
          <p className="text-muted-foreground">
            Resumen de gestión de {metrics?.agencyInfo?.name || "Agencia"}
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Total de Agentes"
          value={metrics?.agencyInfo?.totalAgents || 0}
          description={`${metrics?.agencyInfo?.activeAgents || 0} activos`}
          icon={Users}
        />
        <MetricsCard
          title="Total de Propiedades"
          value={agencyProperties?.total || 0}
          description="Todas las publicaciones de tus agentes"
          icon={Home}
        />
        <MetricsCard
          title="Pendientes de Aprobación"
          value={agencyProperties?.pending || 0}
          description="Esperando tu revisión"
          icon={Clock}
        />
        <MetricsCard
          title="Tasa de Aprobación"
          value={`${approvalRate}%`}
          description="Propiedades aprobadas"
          icon={CheckCircle}
        />
      </div>

      {/* Management Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Tareas comunes de gestión de agencia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start">
              <Link href="/properties/pending">
                <Clock className="mr-2 h-4 w-4" />
                Revisar Propiedades Pendientes
                {(agencyProperties?.pending || 0) > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {agencyProperties?.pending}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/agents">
                <Users className="mr-2 h-4 w-4" />
                Gestionar Agentes
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/properties">
                <Home className="mr-2 h-4 w-4" />
                Ver Todas las Propiedades
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agentes con Mejor Rendimiento</CardTitle>
            <CardDescription>
              Agentes con más propiedades aprobadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics?.topAgents && metrics.topAgents.length > 0 ? (
              <div className="space-y-3">
                {metrics.topAgents.slice(0, 5).map((agent, index) => (
                  <div key={agent.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">#{index + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {agent.propertyCount} propiedades
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay datos de agentes disponibles
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Properties */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Property Submissions</CardTitle>
          <CardDescription>
            Latest properties submitted by your agents
          </CardDescription>
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
                      by {property.agentName} •{" "}
                      {new Date(property.createdAt).toLocaleDateString()}
                    </p>
                  </div>
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
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Home className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">
                No recent properties
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Properties submitted by your agents will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
