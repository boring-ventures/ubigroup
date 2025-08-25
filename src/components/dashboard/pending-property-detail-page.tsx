"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
  MapPin,
  Bed,
  Bath,
  Square,
  Car,
  Phone,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Clock,
  User,
  DollarSign,
  Calendar,
  FileText,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Currency, TransactionType } from "@prisma/client";
import Link from "next/link";
import Image from "next/image";
import { PropertySingleMap } from "./property-single-map";
import { useUpdatePropertyStatus } from "@/hooks/use-pending-properties";

interface Property {
  id: string;
  title: string;
  description: string;
  type: string;
  locationState: string;
  locationCity: string;
  locationNeigh: string;
  municipality?: string;
  address?: string;
  googleMapsUrl?: string;
  latitude?: number;
  longitude?: number;
  price: number;
  currency: Currency;
  exchangeRate: number | null;
  bedrooms: number;
  bathrooms: number;
  garageSpaces: number;
  squareMeters: number;
  transactionType: TransactionType;
  status: string;
  images: string[];
  videos: string[];
  features: string[];
  createdAt: string;
  updatedAt: string;
  agent: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    phone: string | null;
  };
  agency: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
}

interface PendingPropertyDetailPageProps {
  initialProperty: Property;
}

export function PendingPropertyDetailPage({
  initialProperty,
}: PendingPropertyDetailPageProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );

  const queryClient = useQueryClient();
  const updateStatusMutation = useUpdatePropertyStatus();

  const property = initialProperty;

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

      // Invalidate and refetch pending properties
      queryClient.invalidateQueries({ queryKey: ["pending-properties"] });

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

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  const formatPrice = (price: number, currency: string) => {
    const formatter = new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: currency === "DOLLARS" ? "USD" : "BOB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/properties/pending">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Pendientes
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {property.title}
            </h1>
            <p className="text-muted-foreground">
              Pendiente de aprobación • Enviado {formatDate(property.createdAt)}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-yellow-600 bg-yellow-50">
          <Clock className="mr-1 h-3 w-3" />
          En Revisión
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          {property.images.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-video">
                  <Image
                    src={property.images[currentImageIndex]}
                    alt={`${property.title} - Imagen ${currentImageIndex + 1}`}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                  {property.images.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                        <Badge
                          variant="secondary"
                          className="bg-black/50 text-white"
                        >
                          {currentImageIndex + 1} / {property.images.length}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                Detalles de la Propiedad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Bed className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {property.bedrooms} dormitorio
                    {property.bedrooms !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Bath className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {property.bathrooms} baño
                    {property.bathrooms !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {property.garageSpaces} garaje
                    {property.garageSpaces !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Square className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {property.squareMeters.toLocaleString()} m²
                  </span>
                </div>
              </div>

              <Separator />

              {/* Location */}
              <div>
                <h4 className="font-semibold mb-2">Ubicación</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {property.address || "No se especificó dirección"}
                    </span>
                  </div>
                  <div className="ml-6">
                    {property.locationNeigh}, {property.locationCity},{" "}
                    {property.locationState}
                    {property.municipality && `, ${property.municipality}`}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <h4 className="font-semibold mb-2">Descripción</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {property.description}
                </p>
              </div>

              {/* Features */}
              {property.features && property.features.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">Características</h4>
                    <div className="flex flex-wrap gap-2">
                      {property.features.map((feature, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Map */}
              {property.latitude && property.longitude && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">Mapa de Ubicación</h4>
                    <div className="h-64 rounded-lg overflow-hidden">
                      <PropertySingleMap property={property} />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                Información de Precio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {formatPrice(property.price, property.currency)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {property.transactionType}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tipo de Propiedad:</span>
                  <span className="font-medium">{property.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Transacción:</span>
                  <span className="font-medium">
                    {property.transactionType}
                  </span>
                </div>
                {property.exchangeRate && (
                  <div className="flex justify-between text-sm">
                    <span>Tipo de Cambio:</span>
                    <span className="font-medium">
                      Bs {property.exchangeRate.toFixed(2)}/$
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Agent Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                Información del Agente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={property.agent.avatarUrl || undefined} />
                  <AvatarFallback>
                    {property.agent.firstName?.[0]}
                    {property.agent.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {property.agent.firstName} {property.agent.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {property.agency.name}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                {property.agent.phone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{property.agent.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submission Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                Detalles de Envío
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Enviado:</span>
                <span className="font-medium">
                  {formatDate(property.createdAt)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Última Actualización:</span>
                <span className="font-medium">
                  {formatDate(property.updatedAt)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones de Revisión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                onClick={() => handleApprove(property.id)}
                disabled={updateStatusMutation.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprobar Propiedad
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => handleReject(property.id)}
                disabled={updateStatusMutation.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Rechazar Propiedad
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

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
    </div>
  );
}
