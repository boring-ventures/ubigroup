"use client";

import { Suspense, useEffect, useState } from "react";
import { UserManagement } from "@/components/user-management/user-management";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Settings } from "lucide-react";

interface UserMetrics {
  totalUsers: number;
  superAdmins: number;
  agencyAdmins: number;
  agents: number;
}

interface User {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  role: "SUPER_ADMIN" | "AGENCY_ADMIN" | "AGENT";
  phone: string | null;
  avatarUrl: string | null;
  active: boolean;
  createdAt: string;
  agencyId: string | null;
  agency?: {
    id: string;
    name: string;
  } | null;
}

export default function UsersPage() {
  const [metrics, setMetrics] = useState<UserMetrics>({
    totalUsers: 0,
    superAdmins: 0,
    agencyAdmins: 0,
    agents: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchUserMetrics = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        const users = data.users || [];

        const metrics = {
          totalUsers: users.length,
          superAdmins: users.filter((user: User) => user.role === "SUPER_ADMIN")
            .length,
          agencyAdmins: users.filter(
            (user: User) => user.role === "AGENCY_ADMIN"
          ).length,
          agents: users.filter((user: User) => user.role === "AGENT").length,
        };

        setMetrics(metrics);
      }
    } catch (error) {
      console.error("Failed to fetch user metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserMetrics();
  }, []);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Gestión de Usuarios
          </h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Gestiona todos los usuarios del sistema, agencias y roles
          </p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Usuarios
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : metrics.totalUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              Todos los usuarios del sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Super Administradores
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : metrics.superAdmins}
            </div>
            <p className="text-xs text-muted-foreground">
              Administradores de la plataforma
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Administradores de Agencia
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : metrics.agencyAdmins}
            </div>
            <p className="text-xs text-muted-foreground">Gerentes de agencia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agentes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : metrics.agents}
            </div>
            <p className="text-xs text-muted-foreground">
              Agentes inmobiliarios
            </p>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={<div>Cargando usuarios...</div>}>
        <UserManagement onUserUpdate={fetchUserMetrics} />
      </Suspense>
    </div>
  );
}
