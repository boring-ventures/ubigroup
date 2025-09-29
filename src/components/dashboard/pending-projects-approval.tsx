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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  Building2,
  MapPin,
  XCircle,
  Eye,
  Calendar,
  Maximize2,
} from "lucide-react";
import Link from "next/link";
import {
  usePendingProjects,
  useUpdateProjectStatus,
  type UsePendingProjectsParams,
  type PendingProject,
} from "@/hooks/use-pending-projects";
import { toast } from "@/components/ui/use-toast";

export function PendingProjectsApproval() {
  const [params, setParams] = useState<UsePendingProjectsParams>({
    page: 1,
    limit: 5, // Show fewer per page for detailed review
  });
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [quickViewProject, setQuickViewProject] =
    useState<PendingProject | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const { data, isLoading, error } = usePendingProjects(params);
  const updateStatusMutation = useUpdateProjectStatus();

  const handlePageChange = (page: number) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const handleApprove = (projectId: string) => {
    setSelectedProject(projectId);
    setActionType("approve");
  };

  const handleReject = (projectId: string) => {
    setSelectedProject(projectId);
    setActionType("reject");
    setRejectionReason("");
  };

  const handleQuickView = (project: PendingProject) => {
    setQuickViewProject(project);
    setIsQuickViewOpen(true);
  };

  const closeQuickView = () => {
    setQuickViewProject(null);
    setIsQuickViewOpen(false);
  };

  const handleConfirmAction = async () => {
    if (!selectedProject || !actionType) return;

    try {
      await updateStatusMutation.mutateAsync({
        projectId: selectedProject,
        status: actionType === "approve" ? "APPROVED" : "REJECTED",
        rejectionMessage: actionType === "reject" ? rejectionReason : undefined,
      });

      toast({
        title: "Éxito",
        description: `Proyecto ${actionType === "approve" ? "aprobado" : "rechazado"} exitosamente`,
      });

      setSelectedProject(null);
      setActionType(null);
      setRejectionReason("");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al actualizar el estado del proyecto",
        variant: "destructive",
      });
    }
  };

  const closeDialog = () => {
    setSelectedProject(null);
    setActionType(null);
    setRejectionReason("");
  };

  const getTotalQuadrants = (floors: PendingProject["floors"]) => {
    return floors.reduce((total, floor) => total + floor.quadrants.length, 0);
  };

  const getStatusCounts = (floors: PendingProject["floors"]) => {
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
            Error al cargar proyectos pendientes
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
              <CheckCircle className="mx-auto h-12 w-12 text-green-500/40" />
              <h3 className="mt-4 text-lg font-medium">¡Todo al día!</h3>
              <p className="text-muted-foreground">
                No hay proyectos pendientes que requieran tu revisión en este
                momento.
              </p>
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
                      className="border-l-4 border-l-yellow-500"
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
                                <Badge variant="secondary">
                                  {totalQuadrants} unidades
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">
                                Enviado{" "}
                                {new Date(
                                  project.createdAt
                                ).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                por {project.agent?.firstName || "Desconocido"}{" "}
                                {project.agent?.lastName || ""}
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

                          {/* Action Buttons */}
                          <div className="flex items-center justify-end space-x-3 pt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickView(project)}
                            >
                              <Maximize2 className="mr-2 h-4 w-4" />
                              Vista Rápida
                            </Button>
                            <Link href={`/projects/${project.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalles
                              </Button>
                            </Link>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleReject(project.id)}
                              disabled={updateStatusMutation.isPending}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Rechazar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(project.id)}
                              disabled={updateStatusMutation.isPending}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Aprobar
                            </Button>
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
                    {data.total} proyectos pendientes
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

      {/* Approval/Rejection Dialog */}
      <Dialog
        open={!!selectedProject}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve"
                ? "Aprobar Proyecto"
                : "Rechazar Proyecto"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Este proyecto será aprobado y será visible al público."
                : "Por favor proporcione una razón para rechazar este proyecto."}
            </DialogDescription>
          </DialogHeader>

          {actionType === "reject" && (
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Razón de Rechazo *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Por favor explique por qué este proyecto está siendo rechazado..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={updateStatusMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={
                updateStatusMutation.isPending ||
                (actionType === "reject" && !rejectionReason.trim())
              }
              variant={actionType === "approve" ? "default" : "destructive"}
            >
              {updateStatusMutation.isPending
                ? "Procesando..."
                : actionType === "approve"
                  ? "Aprobar Proyecto"
                  : "Rechazar Proyecto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick View Modal */}
      <Dialog open={isQuickViewOpen} onOpenChange={setIsQuickViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Vista Rápida - Proyecto
            </DialogTitle>
          </DialogHeader>

          {quickViewProject && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">
                    {quickViewProject.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Proyecto</Badge>
                    <Badge variant="secondary">Pendiente</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    {getTotalQuadrants(quickViewProject.floors)} unidades
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Creado{" "}
                    {new Date(quickViewProject.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{quickViewProject.location}</span>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-semibold mb-2">Descripción</h4>
                <p className="text-muted-foreground">
                  {quickViewProject.description ||
                    "No hay descripción disponible"}
                </p>
              </div>

              {/* Project Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {quickViewProject.floors.length} piso
                    {quickViewProject.floors.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">
                    {getStatusCounts(quickViewProject.floors).available}{" "}
                    disponibles
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">
                    {getStatusCounts(quickViewProject.floors).unavailable} no
                    disponibles
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">
                    {getStatusCounts(quickViewProject.floors).reserved}{" "}
                    reservados
                  </span>
                </div>
              </div>

              {/* Agent Information */}
              <div className="bg-gray-50 rounded-md p-4">
                <h4 className="font-semibold mb-2">Información del Agente</h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    <strong>Agente:</strong>{" "}
                    {quickViewProject.agent?.firstName || "Desconocido"}{" "}
                    {quickViewProject.agent?.lastName || ""}
                  </span>
                </div>
                {quickViewProject.agent?.phone && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Teléfono:</strong> {quickViewProject.agent.phone}
                  </div>
                )}
              </div>

              {/* Floors and Quadrants Details */}
              <div>
                <h4 className="font-semibold mb-3">Detalles por Piso</h4>
                <div className="space-y-3">
                  {quickViewProject.floors.map((floor) => (
                    <div key={floor.id} className="border rounded-md p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">
                          Piso {floor.number}
                          {floor.name && ` - ${floor.name}`}
                        </h5>
                        <Badge variant="outline">
                          {floor.quadrants.length} unidades
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>
                            {
                              floor.quadrants.filter(
                                (q) => q.status === "AVAILABLE"
                              ).length
                            }{" "}
                            disponibles
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <XCircle className="h-3 w-3 text-red-500" />
                          <span>
                            {
                              floor.quadrants.filter(
                                (q) => q.status === "UNAVAILABLE"
                              ).length
                            }{" "}
                            no disponibles
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-blue-500" />
                          <span>
                            {
                              floor.quadrants.filter(
                                (q) => q.status === "RESERVED"
                              ).length
                            }{" "}
                            reservados
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={closeQuickView}>
                  Cerrar
                </Button>
                <Link href={`/projects/${quickViewProject.id}`}>
                  <Button>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Detalles Completos
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
