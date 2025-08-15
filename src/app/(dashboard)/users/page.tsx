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
  whatsapp: string | null;
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
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage all system users, agencies, and roles
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : metrics.totalUsers}
            </div>
            <p className="text-xs text-muted-foreground">All system users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : metrics.superAdmins}
            </div>
            <p className="text-xs text-muted-foreground">
              Platform administrators
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agency Admins</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : metrics.agencyAdmins}
            </div>
            <p className="text-xs text-muted-foreground">Agency managers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : metrics.agents}
            </div>
            <p className="text-xs text-muted-foreground">Property agents</p>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <UserManagement onUserUpdate={fetchUserMetrics} />
      </Suspense>
    </div>
  );
}
