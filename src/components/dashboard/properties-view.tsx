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
  MapPin,
  XCircle,
  Eye,
  RotateCcw,
  Clock,
  Download,
  Home,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import {
  useAgentProperties,
  useResendPropertyForApproval,
  type UseAgentPropertiesParams,
  type AgentProperty,
} from "@/hooks/use-agent-properties";
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

// Helper function to get property type label in Spanish
const getPropertyTypeLabel = (propertyType: string) => {
  switch (propertyType) {
    case "APARTMENT":
      return "Apartamento";
    case "HOUSE":
      return "Casa";
    case "COMMERCIAL":
      return "Comercial";
    case "LAND":
      return "Terreno";
    case "OFFICE":
      return "Oficina";
    case "WAREHOUSE":
      return "Depósito";
    case "INDUSTRIAL":
      return "Industrial";
    default:
      return propertyType;
  }
};

// Helper function to get transaction type label in Spanish
const getTransactionTypeLabel = (transactionType: string) => {
  switch (transactionType) {
    case "SALE":
      return "Venta";
    case "RENT":
      return "Alquiler";
    case "BOTH":
      return "Venta/Alquiler";
    default:
      return transactionType;
  }
};

export function PropertiesView() {
  const [filters, setFilters] = useState<PropertyFiltersType>({});
  const [isResendDialogOpen, setIsResendDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

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

  const propertiesParams: UseAgentPropertiesParams = {
    page: 1,
    limit: 100, // Get all items for client-side filtering and export
  };

  const {
    data: propertiesData,
    isLoading: propertiesLoading,
    error: propertiesError,
  } = useAgentProperties(propertiesParams);

  const resendPropertyMutation = useResendPropertyForApproval();
  const queryClient = useQueryClient();

  const handleFiltersChange = (newFilters: PropertyFiltersType) => {
    setFilters(newFilters);
  };

  // Reject property mutation
  const rejectPropertyMutation = useMutation({
    mutationFn: async ({
      propertyId,
      message,
    }: {
      propertyId: string;
      message: string;
    }) => {
      const response = await fetch(`/api/properties/${propertyId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rejectionMessage: message }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al rechazar la propiedad");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Propiedad rechazada exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["agent-properties"] });
      handleCloseRejectDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Error al rechazar la propiedad: ${error.message}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsRejecting(false);
    },
  });

  // Permanent delete property mutation
  const permanentDeletePropertyMutation = useMutation({
    mutationFn: async ({ propertyId }: { propertyId: string }) => {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || "Error al eliminar permanentemente la propiedad"
        );
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Propiedad eliminada permanentemente",
      });
      queryClient.invalidateQueries({ queryKey: ["agent-properties"] });
      handleClosePermanentDeleteDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Error al eliminar permanentemente la propiedad: ${error.message}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsPermanentlyDeleting(false);
    },
  });

  const handleDownloadCSV = () => {
    const properties = propertiesData?.properties || [];
    const csvData = properties.map((property) => ({
      ID: property.id,
      Título: property.title,
      Descripción: property.description,
      Precio: formatPrice(property.price, property.currency),
      Moneda: property.currency,
      Tipo_Propiedad: getPropertyTypeLabel(property.propertyType),
      Tipo_Transacción: getTransactionTypeLabel(property.transactionType),
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

    if (csvData.length === 0) {
      toast({
        title: "No hay datos",
        description: "No hay propiedades para exportar",
        variant: "destructive",
      });
      return;
    }

    exportToCSV(csvData, "propiedades");

    toast({
      title: "Descarga iniciada",
      description: "El archivo CSV se está descargando",
    });
  };

  const handleResend = (id: string) => {
    setSelectedProperty(id);
    setIsResendDialogOpen(true);
  };

  const handleConfirmResend = async () => {
    if (selectedProperty) {
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
    }
  };

  const closeResendDialog = () => {
    setSelectedProperty(null);
    setIsResendDialogOpen(false);
  };

  const handleRejectProperty = (
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
      rejectPropertyMutation.mutate({
        propertyId: itemToReject.id,
        message: rejectionMessage.trim(),
      });
    }
  };

  const confirmPermanentDelete = () => {
    if (itemToReject) {
      setIsPermanentlyDeleting(true);
      permanentDeletePropertyMutation.mutate({
        propertyId: itemToReject.id,
      });
    }
  };

  const properties = propertiesData?.properties || [];

  // Apply filters
  let filteredProperties = properties;
  if (Object.keys(filters).length > 0) {
    filteredProperties = properties.filter((property) => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText =
          `${property.title} ${property.description} ${property.address || ""} ${property.city || ""}`.toLowerCase();
        if (!searchableText.includes(searchTerm)) return false;
      }

      // Status filter
      if (filters.status && property.status !== filters.status) return false;

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

      return true;
    });
  }

  // Sort by creation date (newest first)
  filteredProperties.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Calculate status statistics
  const getStatusStats = () => {
    return properties.reduce(
      (acc, property) => {
        acc[property.status.toLowerCase() as keyof typeof acc]++;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 }
    );
  };

  const stats = getStatusStats();
  const isLoading = propertiesLoading;
  const error = propertiesError;

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Error al cargar propiedades</p>
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
                <p className="text-xs text-muted-foreground">Aprobadas</p>
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
                <p className="text-xs text-muted-foreground">Rechazadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Total Properties Card */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gray-100 rounded-full">
              <Home className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold">
                {filteredProperties.length}
              </p>
              <p className="text-xs text-muted-foreground">
                Total de Propiedades
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
                Gestión de Propiedades
              </CardTitle>
              <CardDescription className="text-sm">
                Ve y gestiona todas tus propiedades
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {stats.pending > 0 && (
                <Button
                  variant="default"
                  onClick={() => {
                    // Filter to show only pending properties
                    setFilters({ ...filters, status: "PENDING" });
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
                disabled={filteredProperties.length === 0}
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
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-10">
              <Home className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-medium">No hay propiedades</h3>
              <p className="text-muted-foreground">
                No tienes propiedades creadas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo / Transacción</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProperties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{property.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {property.description || "Sin descripción"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {getPropertyTypeLabel(property.propertyType)}
                          </div>
                          <div className="text-muted-foreground">
                            {getTransactionTypeLabel(property.transactionType)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {property.address || "Sin dirección"},{" "}
                            {property.city || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatPrice(property.price, property.currency)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(property.status)}>
                          {getStatusLabel(property.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(property.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link href={`/properties/${property.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {property.status === "REJECTED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResend(property.id)}
                              disabled={resendPropertyMutation.isPending}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          {(property.status === "PENDING" ||
                            property.status === "APPROVED") && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                handleRejectProperty(
                                  property.id,
                                  property.title,
                                  property.status
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
            <DialogTitle>Reenviar Propiedad para Aprobación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres reenviar esta propiedad para
              aprobación? La propiedad volverá al estado pendiente y será
              revisada nuevamente por el administrador.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeResendDialog}
              disabled={resendPropertyMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmResend}
              disabled={resendPropertyMutation.isPending}
            >
              {resendPropertyMutation.isPending
                ? "Reenviando..."
                : "Reenviar Propiedad"}
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
              Propiedad
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
                    ? "Explica por qué se rechaza esta propiedad previamente aprobada..."
                    : "Explica por qué se rechaza esta propiedad..."
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
