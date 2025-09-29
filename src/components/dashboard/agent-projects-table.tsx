"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  Building2,
  MapPin,
  XCircle,
  Eye,
  RotateCcw,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import {
  useAgentProjects,
  useResendProjectForApproval,
  type UseAgentProjectsParams,
  type AgentProject,
} from "@/hooks/use-agent-projects";
import { toast } from "@/components/ui/use-toast";
import { PropertyStatus } from "@prisma/client";

// Helper function to get status badge variant
const getStatusBadgeVariant = (status: PropertyStatus) => {
  switch (status) {
    case "PENDING":
      return "secondary";
    case "APPROVED":
      return "default";
    case "REJECTED":
      return "destructive";
    default:
      return "outline";
  }
};

// Helper function to get status label
const getStatusLabel = (status: PropertyStatus) => {
  switch (status) {
    case "PENDING":
      return "Pendiente";
    case "APPROVED":
      return "Aprobado";
    case "REJECTED":
      return "Rechazado";
    default:
      return status;
  }
};

export function AgentProjectsTable() {
  const [params, setParams] = useState<UseAgentProjectsParams>({
    page: 1,
    limit: 10,
  });
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isResendDialogOpen, setIsResendDialogOpen] = useState(false);

  const { data, isLoading, error } = useAgentProjects(params);
  const resendMutation = useResendProjectForApproval();

  const handlePageChange = (page: number) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const handleResend = (projectId: string) => {
    setSelectedProject(projectId);
    setIsResendDialogOpen(true);
  };

  const handleConfirmResend = async () => {
    if (!selectedProject) return;

    try {
      await resendMutation.mutateAsync(selectedProject);

      toast({
        title: "Éxito",
        description: "Proyecto reenviado para aprobación exitosamente",
      });

      setSelectedProject(null);
      setIsResendDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al reenviar el proyecto para aprobación",
        variant: "destructive",
      });
    }
  };

  const closeResendDialog = () => {
    setSelectedProject(null);
    setIsResendDialogOpen(false);
  };

  const getTotalQuadrants = (floors: AgentProject["floors"]) => {
    return floors.reduce((total, floor) => total + floor.quadrants.length, 0);
  };

  const getStatusCounts = (floors: AgentProject["floors"]) => {
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

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">
            Error al cargar proyectos
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Skeleton className="h-24 w-32" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-[250px]" />
                        <Skeleton className="h-4 w-[300px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                      <div className="space-x-2">
                        <Skeleton className="h-9 w-20" />
                        <Skeleton className="h-9 w-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !data?.projects || data.projects.length === 0 ? (
            <div className="text-center py-10">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-medium">No hay proyectos</h3>
              <p className="text-muted-foreground">
                Aún no has creado ningún proyecto.
              </p>
              <div className="mt-4">
                <Button asChild>
                  <Link href="/projects/create">
                    <Building2 className="mr-2 h-4 w-4" />
                    Crear Proyecto
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {data?.projects?.map((project) => {
                  const totalQuadrants = getTotalQuadrants(project.floors);
                  const statusCounts = getStatusCounts(project.floors);
                  
                  return (
                    <Card
                      key={project.id}
                      className={`border-l-4 ${
                        project.status === "PENDING"
                          ? "border-l-yellow-500"
                          : project.status === "APPROVED"
                          ? "border-l-green-500"
                          : "border-l-red-500"
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Project Header */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h3 className="text-lg font-semibold">
                                {project.name}
                              </h3>
                              <div className="flex items-center text-sm text-muted-foreground space-x-4">
                                <div className="flex items-center space-x-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{project.location}</span>
                                </div>
                                <Badge variant={getStatusBadgeVariant(project.status)}>
                                  {getStatusLabel(project.status)}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">
                                {totalQuadrants} unidades
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Creado{" "}
                                {new Date(project.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          {/* Project Details */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y">
                            <div className="flex items-center space-x-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {project.floors.length} piso
                                {project.floors.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">
                                {statusCounts.available} disponibles
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-sm">
                                {statusCounts.unavailable} no disponibles
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-blue-500" />
                              <span className="text-sm">
                                {statusCounts.reserved} reservados
                              </span>
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {project.description ||
                                "No hay descripción disponible"}
                            </p>
                          </div>

                          {/* Rejection Message */}
                          {project.status === "REJECTED" && project.rejectionMessage && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3">
                              <p className="text-sm text-red-800">
                                <strong>Razón de rechazo:</strong> {project.rejectionMessage}
                              </p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center justify-end space-x-3 pt-4">
                            <Link href={`/projects/${project.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalles
                              </Button>
                            </Link>
                            {project.status === "REJECTED" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResend(project.id)}
                                disabled={resendMutation.isPending}
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Reenviar
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(data.currentPage - 1) * params.limit! + 1} a{" "}
                    {Math.min(data.currentPage * params.limit!, data.total)} de{" "}
                    {data.total} proyectos
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(data.currentPage - 1)}
                      disabled={data.currentPage <= 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm">
                      Página {data.currentPage} de {data.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(data.currentPage + 1)}
                      disabled={data.currentPage >= data.totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Resend Confirmation Dialog */}
      <Dialog open={isResendDialogOpen} onOpenChange={setIsResendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reenviar Proyecto para Aprobación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres reenviar este proyecto para aprobación? 
              El proyecto volverá al estado pendiente y será revisado nuevamente por el administrador.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeResendDialog}
              disabled={resendMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmResend}
              disabled={resendMutation.isPending}
            >
              {resendMutation.isPending ? "Reenviando..." : "Reenviar Proyecto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
