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
          <div className="text-center">
            <p className="text-destructive mb-4">
              Error al cargar métricas del panel
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {error.message || "Hubo un error al cargar los datos de tu panel"}
            </p>
            <Button onClick={() => window.location.reload()}>
              Intentar de Nuevo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Panel de Super Administrador
          </h1>
          <p className="text-muted-foreground">
            Resumen de la plataforma y gestión del sistema
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Total de Agencias"
          value={metrics?.totalAgencies || 0}
          description="Agencias activas en la plataforma"
          icon={Building2}
        />
        <MetricsCard
          title="Total de Usuarios"
          value={metrics?.totalUsers || 0}
          description="Usuarios en toda la plataforma"
          icon={Users}
        />
        <MetricsCard
          title="Total de Propiedades"
          value={metrics?.totalProperties || 0}
          description="Todas las publicaciones de propiedades"
          icon={Home}
        />
        <MetricsCard
          title="Tasa de Aprobación"
          value={`${metrics?.approvalRate || 0}%`}
          description="Éxito en aprobación de propiedades"
          icon={TrendingUp}
        />
      </div>

      {/* Management Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Tareas administrativas comunes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start">
              <Link href="/agencies">
                <Building2 className="mr-2 h-4 w-4" />
                Gestionar Agencias
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/users">
                <Users className="mr-2 h-4 w-4" />
                Ver Todos los Usuarios
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/all-properties">
                <Home className="mr-2 h-4 w-4" />
                Revisar Propiedades
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Actividades Recientes
            </CardTitle>
            <CardDescription>
              Últimas actividades de la plataforma
            </CardDescription>
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
              <div className="text-center py-6">
                <Activity className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No hay actividades recientes
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Las actividades de la plataforma aparecerán aquí
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
