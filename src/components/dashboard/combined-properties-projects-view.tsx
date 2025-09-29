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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Home,
} from "lucide-react";
import Link from "next/link";
import {
  useAgentProperties,
  useResendPropertyForApproval,
  type UseAgentPropertiesParams,
  type AgentProperty,
} from "@/hooks/use-agent-properties";
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
import {
  PropertyFilters,
  type PropertyFilters as PropertyFiltersType,
} from "./property-filters";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

type FilterType = "all" | "properties" | "projects";

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

// Helper function to format price with correct currency
const formatPrice = (price: number, currency: string) => {
  if (!price) return "N/A";

  const formatter = new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: currency === "DOLLARS" ? "USD" : "BOB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return formatter.format(price);
};

export function CombinedPropertiesProjectsView() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isResendDialogOpen, setIsResendDialogOpen] = useState(false);
  const [resendType, setResendType] = useState<"property" | "project" | null>(
    null
  );

  // Advanced filters state
  const [filters, setFilters] = useState<PropertyFiltersType>({});

  // Reject/Delete state
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isPermanentDeleteDialogOpen, setIsPermanentDeleteDialogOpen] =
    useState(false);
  const [itemToReject, setItemToReject] = useState<{
    id: string;
    type: "property" | "project";
    title: string;
    currentStatus: PropertyStatus;
  } | null>(null);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [isPermanentlyDeleting, setIsPermanentlyDeleting] = useState(false);

  const propertiesParams: UseAgentPropertiesParams = {
    page: 1,
    limit: 100, // Get all items for client-side filtering and export
  };

  const projectsParams: UseAgentProjectsParams = {
    page: 1,
    limit: 100, // Get all items for client-side filtering and export
  };

  const {
    data: propertiesData,
    isLoading: propertiesLoading,
    error: propertiesError,
  } = useAgentProperties(propertiesParams);
  const {
    data: projectsData,
    isLoading: projectsLoading,
    error: projectsError,
  } = useAgentProjects(projectsParams);

  const resendPropertyMutation = useResendPropertyForApproval();
  const resendProjectMutation = useResendProjectForApproval();
  const queryClient = useQueryClient();

  const handleFiltersChange = (newFilters: PropertyFiltersType) => {
    setFilters(newFilters);
  };

  // Reject item mutation
  const rejectItemMutation = useMutation({
    mutationFn: async ({
      itemId,
      itemType,
      message,
    }: {
      itemId: string;
      itemType: "property" | "project";
      message: string;
    }) => {
      const endpoint =
        itemType === "property"
          ? `/api/properties/${itemId}/reject`
          : `/api/projects/${itemId}/reject`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rejectionMessage: message }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Error al rechazar el ${itemType}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Elemento rechazado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["agent-properties"] });
      queryClient.invalidateQueries({ queryKey: ["agent-projects"] });
      handleCloseRejectDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Error al rechazar el elemento: ${error.message}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsRejecting(false);
    },
  });

  // Permanent delete item mutation
  const permanentDeleteItemMutation = useMutation({
    mutationFn: async ({
      itemId,
      itemType,
    }: {
      itemId: string;
      itemType: "property" | "project";
    }) => {
      const endpoint =
        itemType === "property"
          ? `/api/properties/${itemId}`
          : `/api/projects/${itemId}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || `Error al eliminar permanentemente el ${itemType}`
        );
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Elemento eliminado permanentemente",
      });
      queryClient.invalidateQueries({ queryKey: ["agent-properties"] });
      queryClient.invalidateQueries({ queryKey: ["agent-projects"] });
      handleClosePermanentDeleteDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Error al eliminar permanentemente el elemento: ${error.message}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsPermanentlyDeleting(false);
    },
  });

  const handleDownloadCSV = () => {
    const properties = propertiesData?.properties || [];
    const projects = projectsData?.projects || [];

    let csvData: Record<string, string | number>[] = [];

    if (filter === "all") {
      // Export both properties and projects
      const propertyData = properties.map((property) => ({
        Tipo: "Propiedad",
        ID: property.id,
        Título: property.title,
        Descripción: property.description,
        Precio: formatPrice(property.price, property.currency),
        Moneda: property.currency,
        Tipo_Propiedad: property.propertyType,
        Tipo_Transacción: property.transactionType,
        Dirección: property.address || "N/A",
        Ciudad: property.city || "N/A",
        Estado: property.state || "N/A",
        Habitaciones: property.bedrooms,
        Baños: property.bathrooms,
        Garajes: property.garageSpaces,
        Área: property.area,
        Estado_Aprobación: getStatusLabel(property.status),
        Fecha_Envío: new Date(property.createdAt).toLocaleDateString(),
        Fecha_Actualización: new Date(property.updatedAt).toLocaleDateString(),
      }));

      const projectData = projects.map((project) => ({
        Tipo: "Proyecto",
        ID: project.id,
        Título: project.name,
        Descripción: project.description,
        Precio: "N/A",
        Moneda: "N/A",
        Tipo_Propiedad: "N/A",
        Tipo_Transacción: "N/A",
        Dirección: project.location,
        Ciudad: "N/A",
        Estado: "N/A",
        Habitaciones: "N/A",
        Baños: "N/A",
        Garajes: "N/A",
        Área: "N/A",
        Estado_Aprobación: getStatusLabel(project.status),
        Fecha_Envío: new Date(project.createdAt).toLocaleDateString(),
        Fecha_Actualización: new Date(project.updatedAt).toLocaleDateString(),
      }));

      csvData = [...propertyData, ...projectData];
    } else if (filter === "properties") {
      csvData = properties.map((property) => ({
        ID: property.id,
        Título: property.title,
        Descripción: property.description,
        Precio: formatPrice(property.price, property.currency),
        Moneda: property.currency,
        Tipo_Propiedad: property.propertyType,
        Tipo_Transacción: property.transactionType,
        Dirección: property.address || "N/A",
        Ciudad: property.city || "N/A",
        Estado: property.state || "N/A",
        Habitaciones: property.bedrooms,
        Baños: property.bathrooms,
        Garajes: property.garageSpaces,
        Área: property.area,
        Estado_Aprobación: getStatusLabel(property.status),
        Fecha_Envío: new Date(property.createdAt).toLocaleDateString(),
        Fecha_Actualización: new Date(property.updatedAt).toLocaleDateString(),
      }));
    } else if (filter === "projects") {
      csvData = projects.map((project) => ({
        ID: project.id,
        Título: project.name,
        Descripción: project.description,
        Ubicación: project.location,
        Estado_Aprobación: getStatusLabel(project.status),
        Fecha_Envío: new Date(project.createdAt).toLocaleDateString(),
        Fecha_Actualización: new Date(project.updatedAt).toLocaleDateString(),
      }));
    }

    if (csvData.length === 0) {
      toast({
        title: "No hay datos",
        description: `No hay ${filter === "all" ? "elementos" : filter === "properties" ? "propiedades" : "proyectos"} para exportar`,
        variant: "destructive",
      });
      return;
    }

    const filename =
      filter === "all"
        ? "propiedades-y-proyectos"
        : filter === "properties"
          ? "propiedades"
          : "proyectos";

    exportToCSV(csvData, filename);

    toast({
      title: "Descarga iniciada",
      description: "El archivo CSV se está descargando",
    });
  };

  const handleResend = (id: string, type: "property" | "project") => {
    if (type === "property") {
      setSelectedProperty(id);
    } else {
      setSelectedProject(id);
    }
    setResendType(type);
    setIsResendDialogOpen(true);
  };

  const handleConfirmResend = async () => {
    if (resendType === "property" && selectedProperty) {
      try {
        await resendPropertyMutation.mutateAsync(selectedProperty);
        toast({
          title: "Éxito",
          description: "Propiedad reenviada para aprobación exitosamente",
        });
        closeResendDialog();
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Error al reenviar propiedad para aprobación",
          variant: "destructive",
        });
      }
    } else if (resendType === "project" && selectedProject) {
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
    setSelectedProperty(null);
    setSelectedProject(null);
    setResendType(null);
    setIsResendDialogOpen(false);
  };

  const handleRejectItem = (
    id: string,
    type: "property" | "project",
    title: string,
    currentStatus: PropertyStatus
  ) => {
    setItemToReject({ id, type, title, currentStatus });
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
      rejectItemMutation.mutate({
        itemId: itemToReject.id,
        itemType: itemToReject.type,
        message: rejectionMessage.trim(),
      });
    }
  };

  const confirmPermanentDelete = () => {
    if (itemToReject) {
      setIsPermanentlyDeleting(true);
      permanentDeleteItemMutation.mutate({
        itemId: itemToReject.id,
        itemType: itemToReject.type,
      });
    }
  };

  const getTotalQuadrants = (floors: AgentProject["floors"]) => {
    return floors.reduce((total, floor) => total + floor.quadrants.length, 0);
  };

  const properties = propertiesData?.properties || [];
  const projects = projectsData?.projects || [];

  // Filter items based on selected filter
  let filteredItems =
    filter === "all"
      ? [
          ...properties.map((p) => ({ ...p, type: "property" as const })),
          ...projects.map((p) => ({ ...p, type: "project" as const })),
        ]
      : filter === "properties"
        ? properties.map((p) => ({ ...p, type: "property" as const }))
        : projects.map((p) => ({ ...p, type: "project" as const }));

  // Apply advanced filters
  if (Object.keys(filters).length > 0) {
    filteredItems = filteredItems.filter((item) => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText =
          item.type === "property"
            ? `${item.title} ${item.description} ${item.address || ""} ${item.city || ""}`.toLowerCase()
            : `${item.name} ${item.description} ${item.location}`.toLowerCase();

        if (!searchableText.includes(searchTerm)) return false;
      }

      // Status filter
      if (filters.status && item.status !== filters.status) return false;

      // For properties, apply property-specific filters
      if (item.type === "property") {
        const property = item as AgentProperty & { type: "property" };

        // Location filters
        if (filters.locationState && property.state !== filters.locationState)
          return false;
        if (filters.locationCity && property.city !== filters.locationCity)
          return false;

        // Price filters
        if (filters.minPrice && property.price < filters.minPrice) return false;
        if (filters.maxPrice && property.price > filters.maxPrice) return false;

        // Property type filters
        if (
          filters.propertyType &&
          property.propertyType !== filters.propertyType
        )
          return false;
        if (
          filters.transactionType &&
          property.transactionType !== filters.transactionType
        )
          return false;

        // Bedroom/bathroom filters
        if (filters.minBedrooms && property.bedrooms < filters.minBedrooms)
          return false;
        if (filters.maxBedrooms && property.bedrooms > filters.maxBedrooms)
          return false;
        if (filters.minBathrooms && property.bathrooms < filters.minBathrooms)
          return false;
        if (filters.maxBathrooms && property.bathrooms > filters.maxBathrooms)
          return false;

        // Area filters
        if (filters.minSquareMeters && property.area < filters.minSquareMeters)
          return false;
        if (filters.maxSquareMeters && property.area > filters.maxSquareMeters)
          return false;
      }

      return true;
    });
  }

  // Sort by creation date (newest first)
  filteredItems.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Calculate status statistics
  const getStatusStats = () => {
    const allItems = [...properties, ...projects];
    return allItems.reduce(
      (acc, item) => {
        acc[item.status.toLowerCase() as keyof typeof acc]++;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 }
    );
  };

  const stats = getStatusStats();
  const isLoading = propertiesLoading || projectsLoading;
  const error = propertiesError || projectsError;

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">
            Error al cargar propiedades y proyectos
          </p>
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

      {/* Total Items Card */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gray-100 rounded-full">
              <svg
                className="h-4 w-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
                />
              </svg>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold">
                {filteredItems.length}
              </p>
              <p className="text-xs text-muted-foreground">
                Total de{" "}
                {filter === "all"
                  ? "Elementos"
                  : filter === "properties"
                    ? "Propiedades"
                    : "Proyectos"}
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
                Gestión de Propiedades y Proyectos
              </CardTitle>
              <CardDescription className="text-sm">
                Ve y gestiona todas tus propiedades y proyectos
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadCSV}
                disabled={filteredItems.length === 0}
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
          {/* Type Filter */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <label htmlFor="filter" className="text-sm font-medium">
                Filtrar por tipo:
              </label>
              <Select
                value={filter}
                onValueChange={(value: FilterType) => setFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Seleccionar filtro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="properties">Propiedades</SelectItem>
                  <SelectItem value="projects">Proyectos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredItems.length}{" "}
              {filteredItems.length === 1 ? "elemento" : "elementos"}
            </div>
          </div>

          {/* Advanced Filters */}
          <PropertyFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            showStatusFilter={true}
          />

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
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-10">
              <Home className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-medium">No hay elementos</h3>
              <p className="text-muted-foreground">
                {filter === "all"
                  ? "No tienes propiedades ni proyectos creados."
                  : filter === "properties"
                    ? "No tienes propiedades creadas."
                    : "No tienes proyectos creados."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Precio/Unidades</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {item.type === "property" ? (
                            <Home className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Building2 className="h-4 w-4 text-purple-500" />
                          )}
                          <span className="text-sm font-medium">
                            {item.type === "property"
                              ? "Propiedad"
                              : "Proyecto"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {item.type === "property" ? item.title : item.name}
                          </div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {item.description || "Sin descripción"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {item.type === "property"
                              ? `${item.address || "Sin dirección"}, ${item.city || "N/A"}`
                              : item.location}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.type === "property" ? (
                          <div className="font-medium">
                            {formatPrice(item.price, item.currency)}
                          </div>
                        ) : (
                          <div className="font-medium">
                            {getTotalQuadrants(item.floors)} unidades
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(item.status)}>
                          {getStatusLabel(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={
                              item.type === "property"
                                ? `/properties/${item.id}`
                                : `/projects/${item.id}`
                            }
                          >
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {item.status === "REJECTED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResend(item.id, item.type)}
                              disabled={
                                resendPropertyMutation.isPending ||
                                resendProjectMutation.isPending
                              }
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          {(item.status === "PENDING" ||
                            item.status === "APPROVED") && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                handleRejectItem(
                                  item.id,
                                  item.type,
                                  item.type === "property"
                                    ? item.title
                                    : item.name,
                                  item.status
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
            <DialogTitle>
              Reenviar {resendType === "property" ? "Propiedad" : "Proyecto"}{" "}
              para Aprobación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres reenviar este{" "}
              {resendType === "property" ? "propiedad" : "proyecto"} para
              aprobación? El{" "}
              {resendType === "property" ? "propiedad" : "proyecto"} volverá al
              estado pendiente y será revisado nuevamente por el administrador.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeResendDialog}
              disabled={
                resendPropertyMutation.isPending ||
                resendProjectMutation.isPending
              }
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmResend}
              disabled={
                resendPropertyMutation.isPending ||
                resendProjectMutation.isPending
              }
            >
              {resendPropertyMutation.isPending ||
              resendProjectMutation.isPending
                ? "Reenviando..."
                : `Reenviar ${resendType === "property" ? "Propiedad" : "Proyecto"}`}
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
              {itemToReject?.type === "property" ? "Propiedad" : "Proyecto"}
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
                    ? "Explica por qué se rechaza este elemento previamente aprobado..."
                    : "Explica por qué se rechaza este elemento..."
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
            {/* Show "Eliminar Permanentemente" for both pending and approved items */}
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
