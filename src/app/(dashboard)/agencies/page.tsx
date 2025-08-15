"use client";

import { Suspense, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MapPin, Building2, Plus } from "lucide-react";
import { AgencyManagement } from "@/components/agency-management/agency-management";

interface AgencyMetrics {
  totalAgencies: number;
  totalAgents: number;
  activeProperties: number;
  pendingApproval: number;
}

interface User {
  id: string;
  role: string;
  [key: string]: unknown;
}

interface Property {
  id: string;
  status: string;
  [key: string]: unknown;
}

export default function AgenciesPage() {
  const [metrics, setMetrics] = useState<AgencyMetrics>({
    totalAgencies: 0,
    totalAgents: 0,
    activeProperties: 0,
    pendingApproval: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchAgencyMetrics = async () => {
    try {
      const [agenciesResponse, usersResponse, propertiesResponse] =
        await Promise.all([
          fetch("/api/agencies"),
          fetch("/api/users"),
          fetch("/api/properties"),
        ]);

      if (agenciesResponse.ok && usersResponse.ok && propertiesResponse.ok) {
        const agenciesData = await agenciesResponse.json();
        const usersData = await usersResponse.json();
        const propertiesData = await propertiesResponse.json();

        const agencies = agenciesData.agencies || [];
        const users = usersData.users || [];
        const properties = propertiesData.properties || [];

        const metrics = {
          totalAgencies: agencies.length,
          totalAgents: users.filter((user: User) => user.role === "AGENT")
            .length,
          activeProperties: properties.filter(
            (property: Property) => property.status === "APPROVED"
          ).length,
          pendingApproval: properties.filter(
            (property: Property) => property.status === "PENDING"
          ).length,
        };

        setMetrics(metrics);
      }
    } catch (error) {
      console.error("Failed to fetch agency metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgencyMetrics();
  }, []);
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Agency Management
          </h2>
          <p className="text-muted-foreground">
            Manage all real estate agencies in the system
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Agencies
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : metrics.totalAgencies}
            </div>
            <p className="text-xs text-muted-foreground">Active agencies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : metrics.totalAgents}
            </div>
            <p className="text-xs text-muted-foreground">Across all agencies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Properties
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : metrics.activeProperties}
            </div>
            <p className="text-xs text-muted-foreground">Listed properties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approval
            </CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : metrics.pendingApproval}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={<div>Loading agencies...</div>}>
        <AgencyManagement onAgencyUpdate={fetchAgencyMetrics} />
      </Suspense>
    </div>
  );
}
