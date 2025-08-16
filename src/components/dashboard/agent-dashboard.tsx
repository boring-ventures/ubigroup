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
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  DollarSign,
  Layers,
  Building2,
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

  // Access the correct data structure for agents
  const personalStats = metrics?.personalStats;
  const approvalRate = personalStats?.totalProperties
    ? Math.round(
        (personalStats.approvedProperties / personalStats.totalProperties) * 100
      )
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Panel</h1>
          <p className="text-muted-foreground">
            Controla tus publicaciones y rendimiento
          </p>
        </div>
        <Button asChild>
          <Link href="/properties/create">
            <Plus className="mr-2 h-4 w-4" />
            Crear Nueva Propiedad
          </Link>
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Total de Propiedades"
          value={personalStats?.totalProperties || 0}
          description="Todas tus publicaciones"
          icon={Home}
        />
        <MetricsCard
          title="Aprobadas"
          value={personalStats?.approvedProperties || 0}
          description={`${approvalRate}% tasa de aprobación`}
          icon={CheckCircle}
        />
        <MetricsCard
          title="En Revisión"
          value={personalStats?.pendingProperties || 0}
          description="Esperando aprobación"
          icon={Clock}
        />
        <MetricsCard
          title="Precio Promedio"
          value={
            metrics?.performanceInsights?.averagePropertyPrice
              ? `$${metrics.performanceInsights.averagePropertyPrice.toLocaleString()}`
              : "$0"
          }
          description="Promedio de publicaciones"
          icon={DollarSign}
        />
      </div>

      {/* Quick Actions and Status Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Gestiona tus publicaciones de propiedades
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start">
              <Link href="/properties/create">
                <Plus className="mr-2 h-4 w-4" />
                Crear Nueva Propiedad
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/my-properties">
                <Home className="mr-2 h-4 w-4" />
                Ver Todas las Propiedades
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/projects/create">
                <Layers className="mr-2 h-4 w-4" />
                Crear Nuevo Proyecto
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/projects">
                <Building2 className="mr-2 h-4 w-4" />
                Ver Todos los Proyectos
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/properties/pending">
                <Clock className="mr-2 h-4 w-4" />
                Propiedades Pendientes
                {(personalStats?.pendingProperties || 0) > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {personalStats?.pendingProperties}
                  </Badge>
                )}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen del Estado de Propiedades</CardTitle>
            <CardDescription>
              Estado actual de tus publicaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Aprobadas</span>
              </div>
              <span className="text-sm font-medium">
                {personalStats?.approvedProperties || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Pendientes</span>
              </div>
              <span className="text-sm font-medium">
                {personalStats?.pendingProperties || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">Rechazadas</span>
              </div>
              <span className="text-sm font-medium">
                {personalStats?.rejectedProperties || 0}
              </span>
            </div>
            {(personalStats?.totalProperties || 0) > 0 && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Tasa de Aprobación
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
          <CardTitle>Propiedades Recientes</CardTitle>
          <CardDescription>
            Tus últimas publicaciones de propiedades
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
                      Creado {new Date(property.createdAt).toLocaleDateString()}
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
                No hay propiedades aún
              </p>
              <Button asChild className="mt-4">
                <Link href="/properties/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear tu primera propiedad
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
