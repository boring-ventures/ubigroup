"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  Building2,
  MapPin,
  XCircle,
  Eye,
  RotateCcw,
  Clock,
  Download,
  AlertCircle,
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
import { exportToCSV } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Ban } from "lucide-react";

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

// Helper function to get total quadrants
const getTotalQuadrants = (floors: AgentProject["floors"]) => {
  return floors.reduce((total, floor) => total + floor.quadrants.length, 0);
};

export function ProjectsView() {
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | null>(null);
  const [isResendDialogOpen, setIsResendDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Reject/Delete state
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isPermanentDeleteDialogOpen, setIsPermanentDeleteDialogOpen] =
    useState(false);
  const [itemToReject, setItemToReject] = useState<{
    id: string;
    title: string;
    currentStatus: PropertyStatus;
  } | null>(null);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [isPermanentlyDeleting, setIsPermanentlyDeleting] = useState(false);

  const projectsParams: UseAgentProjectsParams = {
    page: 1,
    limit: 100, // Get all items for client-side filtering and export
  };

  const {
    data: projectsData,
    isLoading: projectsLoading,
    error: projectsError,
  } = useAgentProjects(projectsParams);

  const resendProjectMutation = useResendProjectForApproval();
  const queryClient = useQueryClient();

  // Reject project mutation
  const rejectProjectMutation = useMutation({
    mutationFn: async ({
      projectId,
      message,
    }: {
      projectId: string;
      message: string;
    }) => {
      const response = await fetch(`/api/projects/${projectId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rejectionMessage: message }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al rechazar el proyecto");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Proyecto rechazado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["agent-projects"] });
      handleCloseRejectDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Error al rechazar el proyecto: ${error.message}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsRejecting(false);
    },
  });

  // Permanent delete project mutation
  const permanentDeleteProjectMutation = useMutation({
    mutationFn: async ({ projectId }: { projectId: string }) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || "Error al eliminar permanentemente el proyecto"
        );
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Proyecto eliminado permanentemente",
      });
      queryClient.invalidateQueries({ queryKey: ["agent-projects"] });
      handleClosePermanentDeleteDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Error al eliminar permanentemente el proyecto: ${error.message}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsPermanentlyDeleting(false);
    },
  });

  const handleDownloadCSV = () => {
    const projects = projectsData?.projects || [];
    const csvData = projects.map((project) => ({
      ID: project.id,
      Título: project.name,
      Descripción: project.description,
      Ubicación: project.location,
      Estado_Aprobación: getStatusLabel(project.status),
      Fecha_Envío: new Date(project.createdAt).toLocaleDateString(),
      Fecha_Actualización: new Date(project.updatedAt).toLocaleDateString(),
    }));

    if (csvData.length === 0) {
      toast({
        title: "No hay datos",
        description: "No hay proyectos para exportar",
        variant: "destructive",
      });
      return;
    }

    exportToCSV(csvData, "proyectos");

    toast({
      title: "Descarga iniciada",
      description: "El archivo CSV se está descargando",
    });
  };

  const handleResend = (id: string) => {
    setSelectedProject(id);
    setIsResendDialogOpen(true);
  };

  const handleConfirmResend = async () => {
    if (selectedProject) {
      try {
        await resendProjectMutation.mutateAsync(selectedProject);
        toast({
          title: "Éxito",
          description: "Proyecto reenviado para aprobación exitosamente",
        });
        closeResendDialog();
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Error al reenviar proyecto para aprobación",
          variant: "destructive",
        });
      }
    }
  };

  const closeResendDialog = () => {
    setSelectedProject(null);
    setIsResendDialogOpen(false);
  };

  const handleRejectProject = (
    id: string,
    title: string,
    currentStatus: PropertyStatus
  ) => {
    setItemToReject({ id, title, currentStatus });
    setRejectionMessage("");
    setIsRejectDialogOpen(true);
  };

  const handleCloseRejectDialog = () => {
    setIsRejectDialogOpen(false);
    setItemToReject(null);
    setRejectionMessage("");
  };

  const handlePermanentDelete = () => {
    setIsRejectDialogOpen(false);
    setIsPermanentDeleteDialogOpen(true);
  };

  const handleClosePermanentDeleteDialog = () => {
    setIsPermanentDeleteDialogOpen(false);
    setItemToReject(null);
  };

  const confirmReject = () => {
    if (itemToReject && rejectionMessage.trim()) {
      setIsRejecting(true);
      rejectProjectMutation.mutate({
        projectId: itemToReject.id,
        message: rejectionMessage.trim(),
      });
    }
  };

  const confirmPermanentDelete = () => {
    if (itemToReject) {
      setIsPermanentlyDeleting(true);
      permanentDeleteProjectMutation.mutate({
        projectId: itemToReject.id,
      });
    }
  };

  const projects = projectsData?.projects || [];

  // Apply status filter
  let filteredProjects = projects;
  if (statusFilter) {
    filteredProjects = projects.filter(
      (project) => project.status === statusFilter
    );
  }

  // Sort by creation date (newest first)
  const sortedProjects = [...filteredProjects].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Calculate status statistics
  const getStatusStats = () => {
    return projects.reduce(
      (acc, project) => {
        acc[project.status.toLowerCase() as keyof typeof acc]++;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 }
    );
  };

  const stats = getStatusStats();
  const isLoading = projectsLoading;
  const error = projectsError;

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Error al cargar proyectos</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Status Overview Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">En Revisión</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">
                  {stats.approved}
                </p>
                <p className="text-xs text-muted-foreground">Aprobados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 md:col-span-1">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 rounded-full">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">
                  {stats.rejected}
                </p>
                <p className="text-xs text-muted-foreground">Rechazados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Total Projects Card */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gray-100 rounded-full">
              <Building2 className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold">
                {sortedProjects.length}
              </p>
              <p className="text-xs text-muted-foreground">
                Total de Proyectos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">
                Gestión de Proyectos
              </CardTitle>
              <CardDescription className="text-sm">
                Ve y gestiona todos tus proyectos
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {stats.pending > 0 && (
                <Button
                  variant="default"
                  onClick={() => {
                    // Filter to show only pending projects
                    setStatusFilter("PENDING");
                  }}
                  className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">
                    Revisar Pendientes ({stats.pending})
                  </span>
                  <span className="sm:hidden">
                    Pendientes ({stats.pending})
                  </span>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleDownloadCSV}
                disabled={sortedProjects.length === 0}
                className="w-full sm:w-auto"
              >
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Exportar CSV</span>
                <span className="sm:hidden">Exportar</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {/* Status Filter */}
          {statusFilter && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">
                    Mostrando solo proyectos{" "}
                    {getStatusLabel(statusFilter).toLowerCase()}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusFilter(null)}
                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                >
                  Limpiar filtro
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : sortedProjects.length === 0 ? (
            <div className="text-center py-10">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-medium">No hay proyectos</h3>
              <p className="text-muted-foreground">
                No tienes proyectos creados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Unidades</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{project.name}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {project.description || "Sin descripción"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          <span>{project.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {getTotalQuadrants(project.floors)} unidades
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(project.status)}>
                          {getStatusLabel(project.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link href={`/projects/${project.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {project.status === "REJECTED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResend(project.id)}
                              disabled={resendProjectMutation.isPending}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          {(project.status === "PENDING" ||
                            project.status === "APPROVED") && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                handleRejectProject(
                                  project.id,
                                  project.name,
                                  project.status
                                )
                              }
                              disabled={isRejecting}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resend Confirmation Dialog */}
      <Dialog open={isResendDialogOpen} onOpenChange={setIsResendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reenviar Proyecto para Aprobación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres reenviar este proyecto para
              aprobación? El proyecto volverá al estado pendiente y será
              revisado nuevamente por el administrador.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeResendDialog}
              disabled={resendProjectMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmResend}
              disabled={resendProjectMutation.isPending}
            >
              {resendProjectMutation.isPending
                ? "Reenviando..."
                : "Reenviar Proyecto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {itemToReject?.currentStatus === "APPROVED"
                ? "Rechazar"
                : "Rechazar"}{" "}
              Proyecto
            </DialogTitle>
            <DialogDescription>
              {itemToReject?.currentStatus === "APPROVED"
                ? `¿Estás seguro de que quieres rechazar "${itemToReject?.title}"? Esta acción cambiará el estado de aprobado a rechazado y notificará al agente.`
                : `¿Estás seguro de que quieres rechazar "${itemToReject?.title}"? Esta acción cambiará el estado a rechazado y notificará al agente.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-message">
                Mensaje de rechazo (opcional)
              </Label>
              <Textarea
                id="rejection-message"
                placeholder={
                  itemToReject?.currentStatus === "APPROVED"
                    ? "Explica por qué se rechaza este proyecto previamente aprobado..."
                    : "Explica por qué se rechaza este proyecto..."
                }
                value={rejectionMessage}
                onChange={(e) => setRejectionMessage(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseRejectDialog}
              disabled={isRejecting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handlePermanentDelete}
              disabled={isRejecting}
            >
              Eliminar Permanentemente
            </Button>
            <Button onClick={confirmReject} disabled={isRejecting}>
              {isRejecting ? "Rechazando..." : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Dialog */}
      <AlertDialog
        open={isPermanentDeleteDialogOpen}
        onOpenChange={setIsPermanentDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente
              &quot;
              {itemToReject?.title}&quot; y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleClosePermanentDeleteDialog}
              disabled={isPermanentlyDeleting}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPermanentDelete}
              disabled={isPermanentlyDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPermanentlyDeleting
                ? "Eliminando..."
                : "Eliminar Permanentemente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
