"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Building2,
  MapPin,
  Calendar,
  Eye,
  Trash2,
  Filter,
  Edit,
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/use-toast";

// Client-side only date formatter to prevent hydration errors
function ClientDateFormatter({ date }: { date: string }) {
  const [formattedDate, setFormattedDate] = useState<string>("");

  React.useEffect(() => {
    setFormattedDate(new Date(date).toLocaleDateString());
  }, [date]);

  return <span>{formattedDate}</span>;
}

interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionMessage?: string | null;
  images: string[];
  brochureUrl?: string | null;
  createdAt: string;
  active: boolean;
  agent: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  agency: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  floors: {
    id: string;
    number: number;
    name: string | null;
    quadrants: {
      id: string;
      customId: string;
      status: string;
    }[];
  }[];
}

export function ProjectsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(
    null
  );

  const {
    data: projects = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["projects", searchQuery, statusFilter],
    queryFn: async (): Promise<Project[]> => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/projects?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Error al cargar los proyectos");
      }
      const data = await response.json();
      return data.projects || [];
    },
  });

  const handleDeleteProject = async (projectId: string) => {
    try {
      setDeletingProjectId(projectId);
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar el proyecto");
      }

      // Refetch projects to update the list
      refetch();

      toast({
        title: "Proyecto eliminado",
        description: "El proyecto se ha eliminado correctamente.",
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al eliminar el proyecto",
        variant: "destructive",
      });
    } finally {
      setDeletingProjectId(null);
    }
  };

  const getTotalQuadrants = (floors: Project["floors"]) => {
    return floors.reduce((total, floor) => total + floor.quadrants.length, 0);
  };

  const getStatusCounts = (floors: Project["floors"]) => {
    const counts = { available: 0, unavailable: 0, reserved: 0 };
    floors.forEach((floor) => {
      floor.quadrants.forEach((quadrant) => {
        if (quadrant.status === "AVAILABLE") counts.available++;
        else if (quadrant.status === "UNAVAILABLE") counts.unavailable++;
        else if (quadrant.status === "RESERVED") counts.reserved++;
      });
    });
    return counts;
  };

  const getProjectStatusBadge = (status: Project["status"]) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="secondary" className="text-xs">
            Pendiente
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge
            variant="default"
            className="text-xs bg-green-600 hover:bg-green-700"
          >
            Aprobado
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive" className="text-xs">
            Rechazado
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
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
              No se pudieron cargar los proyectos
            </p>
            <Button onClick={() => refetch()}>Intentar de nuevo</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search and Filter Section */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder="Buscar proyectos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
          </div>
          <div className="flex gap-2 sm:gap-3">
            <div className="flex-1 sm:flex-none sm:w-40">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="APPROVED">Aprobado</SelectItem>
                  <SelectItem value="REJECTED">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button asChild className="flex-1 sm:flex-none">
              <Link href="/projects/create">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Crear proyecto</span>
                <span className="sm:hidden">Crear</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No se encontraron proyectos
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "No hay proyectos que coincidan con tu búsqueda."
                  : "Aún no has creado ningún proyecto."}
              </p>
              {!searchQuery && (
                <Button asChild>
                  <Link href="/projects/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Crea tu primer proyecto
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const totalQuadrants = getTotalQuadrants(project.floors);
            const statusCounts = getStatusCounts(project.floors);

            return (
              <Card
                key={project.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg break-words">
                        {project.name}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1 sm:mt-2">
                        <MapPin className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate text-xs sm:text-sm">
                          {project.location}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {getProjectStatusBadge(project.status)}
                      <Badge
                        variant={project.active ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {project.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Pisos:</span>
                      <span className="font-medium">
                        {project.floors.length}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">
                        Cuadrantes totales:
                      </span>
                      <span className="font-medium">{totalQuadrants}</span>
                    </div>

                    {totalQuadrants > 0 && (
                      <div className="flex flex-col gap-2 text-xs sm:text-sm">
                        <span className="text-muted-foreground">
                          Estado cuadrantes:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="default" className="text-xs">
                            {statusCounts.available} Disp.
                          </Badge>
                          <Badge variant="destructive" className="text-xs">
                            {statusCounts.unavailable} No disp.
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {statusCounts.reserved} Reserv.
                          </Badge>
                        </div>
                      </div>
                    )}

                    {project.status === "REJECTED" &&
                      project.rejectionMessage && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-xs text-red-700">
                            <strong>Motivo de rechazo:</strong>{" "}
                            {project.rejectionMessage}
                          </p>
                        </div>
                      )}
                  </div>

                  <div className="flex flex-col gap-3 mt-4 pt-4 border-t">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="mr-1 h-3 w-3" />
                      <ClientDateFormatter date={project.createdAt} />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="text-xs"
                      >
                        <Link href={`/projects/${project.id}`}>
                          <Eye className="h-3 w-3 mr-1" />
                          <span className="hidden xs:inline">Ver</span>
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="text-xs"
                      >
                        <Link href={`/projects/${project.id}/edit`}>
                          <Edit className="h-3 w-3 mr-1" />
                          <span className="hidden xs:inline">Editar</span>
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={deletingProjectId === project.id}
                            className="text-xs border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            <span className="hidden xs:inline">
                              {deletingProjectId === project.id
                                ? "Eliminando..."
                                : "Eliminar"}
                            </span>
                            <span className="xs:hidden">
                              {deletingProjectId === project.id ? "..." : ""}
                            </span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              ¿Eliminar proyecto?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              ¿Estás seguro de que quieres eliminar el proyecto
                              &ldquo;{project.name}&rdquo;? Esta acción no se
                              puede deshacer y eliminará todos los pisos y
                              cuadrantes asociados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteProject(project.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
