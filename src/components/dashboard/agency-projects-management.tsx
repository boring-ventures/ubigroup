"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import {
  useAgencyProjects,
  type UseAgencyProjectsParams,
  type AgencyProjectsResponse,
} from "@/hooks/use-agency-projects";
import { useAgencyAgents } from "@/hooks/use-agency-agents";
import {
  Building2,
  MapPin,
  Eye,
  MoreHorizontal,
  Search,
  Download,
  Filter,
} from "lucide-react";
import Link from "next/link";

// Client-side only date formatter to prevent hydration errors
function ClientDateFormatter({ date }: { date: string }) {
  const [formattedDate, setFormattedDate] = useState<string>("");

  React.useEffect(() => {
    setFormattedDate(new Date(date).toLocaleDateString());
  }, [date]);

  return <span>{formattedDate}</span>;
}

// Type definitions based on the Prisma schema and hook response
type Floor = AgencyProjectsResponse["projects"][0]["floors"][0];
type Quadrant = Floor["quadrants"][0];

export function AgencyProjectsManagement() {
  const [params, setParams] = useState<UseAgencyProjectsParams>({
    page: 1,
    limit: 10,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("all");
  const { toast } = useToast();

  // Fetch agents for filter
  const { data: agentsData } = useAgencyAgents();
  const agents = agentsData?.agents || [];

  // Fetch projects
  const { data, isLoading, error } = useAgencyProjects({
    ...params,
    search: searchQuery || undefined,
    agentId: selectedAgentId !== "all" ? selectedAgentId : undefined,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setParams((prev) => ({ ...prev, page: 1 })); // Reset to first page when searching
  };

  const handleAgentFilter = (agentId: string) => {
    setSelectedAgentId(agentId);
    setParams((prev) => ({ ...prev, page: 1 })); // Reset to first page when filtering
  };

  const handlePageChange = (page: number) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const getTotalQuadrants = (floors: Floor[]) => {
    return floors.reduce((total, floor) => total + floor.quadrants.length, 0);
  };

  const getStatusCounts = (floors: Floor[]) => {
    const counts = { available: 0, unavailable: 0, reserved: 0 };
    floors.forEach((floor) => {
      floor.quadrants.forEach((quadrant: Quadrant) => {
        if (quadrant.status === "AVAILABLE") counts.available++;
        else if (quadrant.status === "UNAVAILABLE") counts.unavailable++;
        else if (quadrant.status === "RESERVED") counts.reserved++;
      });
    });
    return counts;
  };

  const handleDownloadCSV = () => {
    if (!data?.projects || data.projects.length === 0) {
      toast({
        title: "No hay datos",
        description: "No hay proyectos para exportar",
        variant: "destructive",
      });
      return;
    }

    // Transform data for CSV export
    const csvData = data.projects.map((project) => ({
      ID: project.id,
      Nombre: project.name,
      Descripción: project.description,
      Ubicación: project.location,
      Tipo_Propiedad: project.propertyType,
      Agente:
        `${project.agent?.firstName || ""} ${project.agent?.lastName || ""}`.trim() ||
        "N/A",
      Estado: project.active ? "Activo" : "Inactivo",
      Total_Pisos: project.floors.length,
      Total_Cuadrantes: getTotalQuadrants(project.floors),
      Fecha_Creación: new Date(project.createdAt).toLocaleDateString(),
    }));

    // Create CSV content
    const headers = Object.keys(csvData[0]).join(",");
    const rows = csvData.map((row) => Object.values(row).join(","));
    const csvContent = [headers, ...rows].join("\n");

    // Download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "proyectos-agencia.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Éxito",
      description: "Archivo CSV descargado exitosamente",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Skeleton className="h-10 w-full sm:w-64" />
          <Skeleton className="h-10 w-full sm:w-32" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-destructive mb-4">
              Error al cargar los proyectos
            </p>
            <Button onClick={() => window.location.reload()}>
              Intentar de nuevo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar proyectos..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Agente</span>
                <span className="sm:hidden">Filtrar</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleAgentFilter("all")}>
                Todos los agentes
              </DropdownMenuItem>
              {agents.map((agent) => (
                <DropdownMenuItem
                  key={agent.id}
                  onClick={() => handleAgentFilter(agent.id)}
                >
                  {agent.firstName} {agent.lastName}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button
          onClick={handleDownloadCSV}
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            Proyectos de la Agencia
          </CardTitle>
          <CardDescription>
            {data?.pagination.total || 0} proyectos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.projects && data.projects.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Proyecto</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Agente
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Ubicación
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Estado
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Cuadrantes
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Fecha
                    </TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.projects.map((project) => {
                    const statusCounts = getStatusCounts(project.floors);
                    return (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{project.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {project.propertyType}
                            </div>
                            {/* Mobile-only info */}
                            <div className="sm:hidden space-y-1 text-xs text-muted-foreground">
                              <div>
                                Agente: {project.agent?.firstName}{" "}
                                {project.agent?.lastName}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {project.location}
                              </div>
                              <div>
                                <Badge
                                  variant={
                                    project.active ? "default" : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {project.active ? "Activo" : "Inactivo"}
                                </Badge>
                              </div>
                              <div>
                                Cuadrantes: {getTotalQuadrants(project.floors)}
                              </div>
                              <div>
                                Fecha:{" "}
                                <ClientDateFormatter date={project.createdAt} />
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {project.agent?.firstName} {project.agent?.lastName}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                            {project.location}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge
                            variant={project.active ? "default" : "secondary"}
                          >
                            {project.active ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="text-sm">
                            <div>
                              Total: {getTotalQuadrants(project.floors)}
                            </div>
                            <div className="text-muted-foreground">
                              Disp: {statusCounts.available} | Ocup:{" "}
                              {statusCounts.unavailable} | Res:{" "}
                              {statusCounts.reserved}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <ClientDateFormatter date={project.createdAt} />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/projects/${project.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver detalles
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay proyectos</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedAgentId !== "all"
                  ? "No se encontraron proyectos con los filtros aplicados"
                  : "Aún no hay proyectos registrados en la agencia"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            Mostrando {(data.pagination.page - 1) * data.pagination.limit + 1} a{" "}
            {Math.min(
              data.pagination.page * data.pagination.limit,
              data.pagination.total
            )}{" "}
            de {data.pagination.total} proyectos
          </div>
          <div className="flex items-center justify-center sm:justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(data.pagination.page - 1)}
              disabled={data.pagination.page <= 1}
            >
              Anterior
            </Button>
            <span className="text-sm px-2">
              {data.pagination.page} de {data.pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(data.pagination.page + 1)}
              disabled={data.pagination.page >= data.pagination.pages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
