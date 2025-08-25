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
  Home,
  Bed,
  Bath,
  MapPin,
  XCircle,
  Eye,
  Maximize2,
} from "lucide-react";
import Link from "next/link";
import {
  usePendingProperties,
  useUpdatePropertyStatus,
  type UsePendingPropertiesParams,
  type PendingProperty,
} from "@/hooks/use-pending-properties";
import { toast } from "@/components/ui/use-toast";
import { PendingPropertyModal } from "./pending-property-modal";

export function PendingPropertiesApproval() {
  const [params, setParams] = useState<UsePendingPropertiesParams>({
    page: 1,
    limit: 5, // Show fewer per page for detailed review
  });
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [modalProperty, setModalProperty] = useState<PendingProperty | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, error } = usePendingProperties(params);
  const updateStatusMutation = useUpdatePropertyStatus();

  const handlePageChange = (page: number) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const handleApprove = (propertyId: string) => {
    setSelectedProperty(propertyId);
    setActionType("approve");
  };

  const handleReject = (propertyId: string) => {
    setSelectedProperty(propertyId);
    setActionType("reject");
    setRejectionReason("");
  };

  const handleConfirmAction = async () => {
    if (!selectedProperty || !actionType) return;

    try {
      await updateStatusMutation.mutateAsync({
        propertyId: selectedProperty,
        status: actionType === "approve" ? "APPROVED" : "REJECTED",
        rejectionReason: actionType === "reject" ? rejectionReason : undefined,
      });

      toast({
        title: "Éxito",
        description: `Propiedad ${actionType === "approve" ? "aprobada" : "rechazada"} exitosamente`,
      });

      setSelectedProperty(null);
      setActionType(null);
      setRejectionReason("");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al actualizar el estado de la propiedad",
        variant: "destructive",
      });
    }
  };

  const closeDialog = () => {
    setSelectedProperty(null);
    setActionType(null);
    setRejectionReason("");
  };

  const handleQuickView = (property: PendingProperty) => {
    setModalProperty(property);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalProperty(null);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">
            Error al cargar propiedades pendientes
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
          ) : !data?.properties || data.properties.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500/40" />
              <h3 className="mt-4 text-lg font-medium">¡Todo al día!</h3>
              <p className="text-muted-foreground">
                No hay propiedades pendientes que requieran tu revisión en este
                momento.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {data?.properties?.map((property) => (
                  <Card
                    key={property.id}
                    className="border-l-4 border-l-yellow-500"
                  >
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Property Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="text-lg font-semibold">
                              {property.title}
                            </h3>
                            <div className="flex items-center text-sm text-muted-foreground space-x-4">
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span>
                                  {property.address || "Sin dirección"},{" "}
                                  {property.city || "N/A"},{" "}
                                  {property.state || "N/A"}
                                </span>
                              </div>
                              <Badge variant="secondary">
                                {property.propertyType || "N/A"} •{" "}
                                {property.transactionType || "N/A"}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              $
                              {property.price
                                ? property.price.toLocaleString()
                                : "N/A"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Enviado{" "}
                              {new Date(
                                property.createdAt
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        {/* Property Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y">
                          <div className="flex items-center space-x-2">
                            <Bed className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {property.bedrooms || 0} dormitorio
                              {(property.bedrooms || 0) !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Bath className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {property.bathrooms || 0} baño
                              {(property.bathrooms || 0) !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {property.area
                                ? property.area.toLocaleString()
                                : "N/A"}{" "}
                              pies²
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">por </span>
                            <span className="font-medium">
                              {property.agent?.firstName || "Desconocido"}{" "}
                              {property.agent?.lastName || ""}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {property.description ||
                              "No hay descripción disponible"}
                          </p>
                        </div>

                        {/* Features */}
                        {property.features && property.features.length > 0 && (
                          <div>
                            <div className="flex flex-wrap gap-2">
                              {property.features
                                .slice(0, 4)
                                .map((feature, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {feature}
                                  </Badge>
                                ))}
                              {property.features.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{property.features.length - 4} más
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end space-x-3 pt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickView(property)}
                          >
                            <Maximize2 className="mr-2 h-4 w-4" />
                            Vista Rápida
                          </Button>
                          <Link href={`/properties/pending/${property.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="mr-2 h-4 w-4" />
                              Detalles Completos
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleReject(property.id)}
                            disabled={updateStatusMutation.isPending}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Rechazar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(property.id)}
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Aprobar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(data.currentPage - 1) * params.limit! + 1} a{" "}
                    {Math.min(data.currentPage * params.limit!, data.total)} de{" "}
                    {data.total} propiedades pendientes
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
        open={!!selectedProperty}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve"
                ? "Aprobar Propiedad"
                : "Rechazar Propiedad"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Esta propiedad será aprobada y será visible al público."
                : "Por favor proporcione una razón para rechazar esta lista de propiedad."}
            </DialogDescription>
          </DialogHeader>

          {actionType === "reject" && (
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Razón de Rechazo *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Por favor explique por qué esta propiedad está siendo rechazada..."
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
                  ? "Aprobar Propiedad"
                  : "Rechazar Propiedad"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick View Modal */}
      <PendingPropertyModal
        property={modalProperty}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}
