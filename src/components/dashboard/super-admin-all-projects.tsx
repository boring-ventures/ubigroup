"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Search,
  CheckCircle,
  Clock,
  MapPin,
  Eye,
  XCircle,
  Ban,
  Download,
  Trash2,
} from "lucide-react";
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
import { toast } from "@/components/ui/use-toast";
import {
  useSuperAdminProjects,
  useRejectProject,
  useDeleteProject,
  type SuperAdminProject,
} from "@/hooks/use-super-admin-projects";
import { PropertyStatus } from "@prisma/client";
import { exportToCSV } from "@/lib/utils";
import { ProjectDetailsModal } from "./project-details-modal";

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
const getTotalQuadrants = (floors: SuperAdminProject["floors"]) => {
  return floors.reduce((total, floor) => total + floor.quadrants.length, 0);
};

export function SuperAdminAllProjects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [agencyFilter, setAgencyFilter] = useState<string>("all");
  const [selectedProject, setSelectedProject] =
    useState<SuperAdminProject | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isPermanentDeleteDialogOpen, setIsPermanentDeleteDialogOpen] =
    useState(false);
  const [rejectionMessage, setRejectionMessage] = useState("");

  const { data, isLoading, error } = useSuperAdminProjects({
    page: 1,
    limit: 100,
    search: searchTerm || undefined,
    status:
      statusFilter === "all" ? undefined : (statusFilter as PropertyStatus),
    agencyId: agencyFilter === "all" ? undefined : agencyFilter,
  });

  // Fetch agencies for filter
  const { data: agencies = [] } = useQuery({
    queryKey: ["agencies-for-filter"],
    queryFn: async () => {
      const response = await fetch("/api/agencies");
      if (!response.ok) {
        throw new Error("Error al obtener las agencias");
      }
      const data = await response.json();
      return data.agencies || [];
    },
  });

  const rejectProjectMutation = useRejectProject();
  const deleteProjectMutation = useDeleteProject();

  const projects = data?.projects || [];
  const selectedProjectData = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null;

  // Calculate statistics
  const stats = projects.reduce(
    (acc, project) => {
      acc.total++;
      acc[project.status.toLowerCase() as keyof typeof acc]++;
      return acc;
    },
    { total: 0, pending: 0, approved: 0, rejected: 0 }
  );

  const handleViewProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setIsProjectModalOpen(true);
  };

  const handleCloseProjectModal = () => {
    setIsProjectModalOpen(false);
    setSelectedProjectId(null);
  };

  const handleRejectProject = (project: SuperAdminProject) => {
    setSelectedProject(project);
    setRejectionMessage("");
    setIsRejectDialogOpen(true);
  };

  const handleCloseRejectDialog = () => {
    setIsRejectDialogOpen(false);
    setSelectedProject(null);
    setRejectionMessage("");
  };

  const handlePermanentDelete = () => {
    setIsRejectDialogOpen(false);
    setIsPermanentDeleteDialogOpen(true);
  };

  const handleClosePermanentDeleteDialog = () => {
    setIsPermanentDeleteDialogOpen(false);
    setSelectedProject(null);
  };

  const handleReject = async () => {
    if (!selectedProject) return;

    try {
      await rejectProjectMutation.mutateAsync({
        projectId: selectedProject.id,
        rejectionMessage: rejectionMessage || undefined,
      });
      toast({
        title: "Éxito",
        description: "Proyecto rechazado exitosamente",
      });
      handleCloseRejectDialog();
    } catch {
      toast({
        title: "Error",
        description: "Error al rechazar el proyecto",
        variant: "destructive",
      });
    }
  };

  const confirmPermanentDelete = () => {
    if (selectedProject) {
      deleteProjectMutation.mutate(selectedProject.id);
    }
  };

  const handleDownloadCSV = () => {
    const csvData = projects.map((project) => ({
      ID: project.id,
      Nombre: project.name,
      Descripción: project.description,
      Ubicación: project.location,
      Estado: getStatusLabel(project.status),
      Agente:
        `${project.agent.firstName || ""} ${project.agent.lastName || ""}`.trim(),
      Agencia: project.agency.name,
      Unidades: getTotalQuadrants(project.floors),
      Fecha_Creación: new Date(project.createdAt).toLocaleDateString(),
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

    exportToCSV(csvData, "proyectos-super-admin");

    toast({
      title: "Descarga iniciada",
      description: "El archivo CSV se está descargando",
    });
  };

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
    <div className="space-y-6 overflow-x-hidden">
      {/* Statistics Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="ml-2 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  Total
                </p>
                <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-yellow-600 flex-shrink-0" />
              <div className="ml-2 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  Pendientes
                </p>
                <p className="text-lg sm:text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <div className="ml-2 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  Aprobados
                </p>
                <p className="text-lg sm:text-2xl font-bold">
                  {stats.approved}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <div className="ml-2 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  Rechazados
                </p>
                <p className="text-lg sm:text-2xl font-bold">
                  {stats.rejected}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">
                Gestión de Proyectos
              </CardTitle>
              <CardDescription className="text-sm">
                Supervisa y gestiona todos los proyectos de la plataforma
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadCSV}
                disabled={projects.length === 0}
                className="w-full sm:w-auto"
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Exportar CSV</span>
                <span className="sm:hidden">Exportar</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-hidden">
          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar proyectos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>

                {/* Filter Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="PENDING">Pendientes</SelectItem>
                      <SelectItem value="APPROVED">Aprobados</SelectItem>
                      <SelectItem value="REJECTED">Rechazados</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={agencyFilter} onValueChange={setAgencyFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filtrar por agencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las agencias</SelectItem>
                      {agencies.map((agency: { id: string; name: string }) => (
                        <SelectItem key={agency.id} value={agency.id}>
                          {agency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projects Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Proyectos</CardTitle>
              <CardDescription className="text-sm">
                Lista de todos los proyectos registrados en la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 overflow-x-hidden">
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
              ) : projects.length === 0 ? (
                <div className="text-center py-8 sm:py-10">
                  <Building2 className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/40" />
                  <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-medium">
                    No hay proyectos
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchTerm ||
                    statusFilter !== "all" ||
                    agencyFilter !== "all"
                      ? "No hay proyectos que coincidan con los filtros aplicados"
                      : "Aún no hay proyectos registrados en la plataforma"}
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile Card Layout */}
                  <div className="block sm:hidden space-y-3">
                    {projects.map((project) => (
                      <Card key={project.id} className="p-4">
                        <div className="space-y-3">
                          {/* Project Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm truncate">
                                {project.name}
                              </h3>
                              {project.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {project.description}
                                </p>
                              )}
                            </div>
                            <Badge
                              variant={getStatusBadgeVariant(project.status)}
                              className="text-xs ml-2 flex-shrink-0"
                            >
                              {getStatusLabel(project.status)}
                            </Badge>
                          </div>

                          {/* Project Details */}
                          <div className="space-y-2">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span
                                className="truncate max-w-[200px]"
                                title={project.location}
                              >
                                {project.location}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {getTotalQuadrants(project.floors)} unidades
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(project.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          {/* Agent Info */}
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={project.agent.avatarUrl || ""}
                              />
                              <AvatarFallback className="text-xs">
                                {project.agent.firstName?.[0] || ""}
                                {project.agent.lastName?.[0] || ""}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate">
                                {project.agent.firstName}{" "}
                                {project.agent.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {project.agency.name}
                              </p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewProject(project.id)}
                              title="Ver detalles del proyecto"
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRejectProject(project)}
                              className="text-orange-600 hover:text-orange-700 h-8 w-8 p-0"
                              title="Rechazar proyecto"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table Layout */}
                  <div className="hidden sm:block">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[180px]">
                              Proyecto
                            </TableHead>
                            <TableHead className="min-w-[120px]">
                              Ubicación
                            </TableHead>
                            <TableHead className="min-w-[80px]">
                              Unidades
                            </TableHead>
                            <TableHead className="min-w-[120px]">
                              Agente
                            </TableHead>
                            <TableHead className="min-w-[100px]">
                              Agencia
                            </TableHead>
                            <TableHead className="min-w-[80px]">
                              Estado
                            </TableHead>
                            <TableHead className="min-w-[80px]">
                              Fecha
                            </TableHead>
                            <TableHead className="text-right min-w-[80px]">
                              Acciones
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projects.map((project) => (
                            <TableRow key={project.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {project.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground line-clamp-1">
                                    {project.description || "Sin descripción"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1 text-sm">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  <span
                                    className="truncate max-w-[120px]"
                                    title={project.location}
                                  >
                                    {project.location}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-sm">
                                  {getTotalQuadrants(project.floors)} unidades
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Avatar className="h-6 w-6 flex-shrink-0">
                                    <AvatarImage
                                      src={project.agent.avatarUrl || ""}
                                    />
                                    <AvatarFallback className="text-xs">
                                      {project.agent.firstName?.[0] || ""}
                                      {project.agent.lastName?.[0] || ""}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="text-sm min-w-0">
                                    <div className="truncate">
                                      {project.agent.firstName}{" "}
                                      {project.agent.lastName}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm font-medium truncate">
                                  {project.agency.name}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={getStatusBadgeVariant(
                                    project.status
                                  )}
                                  className="text-xs"
                                >
                                  {getStatusLabel(project.status)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {new Date(
                                    project.createdAt
                                  ).toLocaleDateString()}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end space-x-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      handleViewProject(project.id)
                                    }
                                    title="Ver detalles del proyecto"
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRejectProject(project)}
                                    className="text-orange-600 hover:text-orange-700 h-8 w-8 p-0"
                                    title="Rechazar proyecto"
                                  >
                                    <Ban className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <AlertDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
      >
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              Rechazar Proyecto
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              ¿Estás seguro de que quieres rechazar el proyecto &quot;
              {selectedProject?.name}&quot;? Esta acción notificará al agente
              sobre el rechazo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Mensaje de rechazo (opcional)
              </label>
              <Textarea
                placeholder="Explica por qué se rechaza este proyecto..."
                value={rejectionMessage}
                onChange={(e) => setRejectionMessage(e.target.value)}
                className="mt-2 min-h-[80px]"
              />
            </div>
          </div>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              onClick={handleCloseRejectDialog}
              className="w-full sm:w-auto"
            >
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handlePermanentDelete}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Eliminar Permanentemente</span>
              <span className="sm:hidden">Eliminar</span>
            </Button>
            <AlertDialogAction
              onClick={handleReject}
              disabled={rejectProjectMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
            >
              {rejectProjectMutation.isPending ? "Rechazando..." : "Rechazar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog
        open={isPermanentDeleteDialogOpen}
        onOpenChange={setIsPermanentDeleteDialogOpen}
      >
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 text-base sm:text-lg">
              ⚠️ Eliminación Permanente
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              ¿Estás seguro de que quieres eliminar permanentemente el proyecto
              &quot;
              {selectedProject?.name}&quot;?
              <br />
              <br />
              <strong>Esta acción no se puede deshacer</strong> y eliminará:
              <br />
              • Todos los datos del proyecto
              <br />
              • Todas las unidades asociadas
              <br />• Toda la información relacionada
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              onClick={handleClosePermanentDeleteDialog}
              className="w-full sm:w-auto"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPermanentDelete}
              disabled={deleteProjectMutation.isPending}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
            >
              {deleteProjectMutation.isPending
                ? "Eliminando..."
                : "Eliminar Permanentemente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Project Details Modal */}
      <ProjectDetailsModal
        isOpen={isProjectModalOpen}
        onClose={handleCloseProjectModal}
        project={selectedProjectData}
      />
    </div>
  );
}
