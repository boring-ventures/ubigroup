"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Car,
  Heart,
  Share2,
  Phone,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  Building2,
  Eye,
  Calendar,
  User,
} from "lucide-react";

interface Property {
  id: string;
  title: string;
  description: string;
  type: string;
  locationState: string;
  locationCity: string;
  locationNeigh: string;
  address: string | null;
  price: number;
  bedrooms: number;
  bathrooms: number;
  garageSpaces: number;
  squareMeters: number;
  transactionType: string;
  status: string;
  images: string[];
  videos: string[];
  features: string[];
  createdAt: string;
  agent: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    phone: string | null;
    whatsapp: string | null;
  };
  agency: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
}

interface PropertyDetailsModalProps {
  propertyId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PropertyDetailsModal({
  propertyId,
  isOpen,
  onClose,
}: PropertyDetailsModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageGallery, setShowImageGallery] = useState(false);

  // Fetch property details
  const {
    data: property,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["property-details", propertyId],
    queryFn: async (): Promise<Property> => {
      if (!propertyId) throw new Error("Property ID is required");
      const response = await fetch(`/api/properties/${propertyId}`);
      if (!response.ok) {
        throw new Error("Property not found");
      }
      const data = await response.json();
      return data.property;
    },
    enabled: !!propertyId && isOpen,
  });

  const formatPrice = (price: number, transactionType: string) => {
    const formatted = new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "USD",
    }).format(price);

    return transactionType === "RENT" ? `${formatted}/mes` : formatted;
  };

  const getTransactionBadge = (type: string) => {
    return (
      <Badge
        variant={type === "SALE" ? "default" : "secondary"}
        className={`${
          type === "SALE"
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-green-600 hover:bg-green-700 text-white"
        }`}
      >
        {type === "SALE" ? "Venta" : "Alquiler"}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: "secondary",
      APPROVED: "default",
      REJECTED: "destructive",
    } as const;

    const labels = {
      PENDING: "Pendiente",
      APPROVED: "Aprobado",
      REJECTED: "Rechazado",
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getPropertyTypeLabel = (type: string) => {
    switch (type) {
      case "HOUSE":
        return "Casa";
      case "APARTMENT":
        return "Apartamento";
      case "OFFICE":
        return "Oficina";
      case "LAND":
        return "Terreno";
      default:
        return type;
    }
  };

  const handleContactWhatsApp = () => {
    if (property?.agent.whatsapp) {
      const message = encodeURIComponent(
        `¡Hola! Tengo interés en la propiedad "${property.title}" (ID: ${property.id}). ¿Podrías darme más información?`
      );
      const whatsappUrl = `https://wa.me/${property.agent.whatsapp.replace(/\D/g, "")}?text=${message}`;
      window.open(whatsappUrl, "_blank");
    }
  };

  const handleContactPhone = () => {
    if (property?.agent.phone) {
      window.location.href = `tel:${property.agent.phone}`;
    }
  };

  const nextImage = () => {
    if (property && property.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === property.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (property && property.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? property.images.length - 1 : prev - 1
      );
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cargando...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !property) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <Home className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Propiedad no encontrada
              </h3>
              <p className="text-muted-foreground">
                La propiedad solicitada no fue encontrada o no está disponible.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalles de la Propiedad
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{property.title}</h2>
                <div className="flex items-center gap-4 text-muted-foreground mb-3">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>
                      {property.locationNeigh}, {property.locationCity} -{" "}
                      {property.locationState}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getTransactionBadge(property.transactionType)}
                  <Badge variant="outline">
                    {getPropertyTypeLabel(property.type)}
                  </Badge>
                  {getStatusBadge(property.status)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary mb-1">
                  {formatPrice(property.price, property.transactionType)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {property.squareMeters}m²
                </div>
              </div>
            </div>

            {/* Image Gallery */}
            {property.images.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Imágenes</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {property.images.slice(0, 4).map((image, index) => (
                    <div
                      key={index}
                      className="aspect-[4/3] rounded-lg overflow-hidden bg-muted cursor-pointer group"
                      onClick={() => {
                        setCurrentImageIndex(index);
                        setShowImageGallery(true);
                      }}
                    >
                      <img
                        src={image}
                        alt={`${property.title} - Imagen ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ))}
                  {property.images.length > 4 && (
                    <div
                      className="aspect-[4/3] rounded-lg overflow-hidden bg-muted cursor-pointer group relative"
                      onClick={() => setShowImageGallery(true)}
                    >
                      <img
                        src={property.images[4]}
                        alt={`${property.title} - Más imágenes`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-semibold">
                          +{property.images.length - 4} fotos
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Videos */}
            {property.videos && property.videos.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Vídeos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {property.videos.map((video, index) => (
                    <div
                      key={index}
                      className="aspect-video rounded-lg overflow-hidden bg-muted"
                    >
                      <video
                        src={video}
                        controls
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Property Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Property Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Información de la Propiedad</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {property.bedrooms > 0 && (
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg mb-2 mx-auto">
                          <Bed className="h-4 w-4 text-primary" />
                        </div>
                        <div className="font-semibold">{property.bedrooms}</div>
                        <div className="text-xs text-muted-foreground">
                          Habitaciones
                        </div>
                      </div>
                    )}

                    {property.bathrooms > 0 && (
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg mb-2 mx-auto">
                          <Bath className="h-4 w-4 text-primary" />
                        </div>
                        <div className="font-semibold">
                          {property.bathrooms}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Baños
                        </div>
                      </div>
                    )}

                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg mb-2 mx-auto">
                        <Square className="h-4 w-4 text-primary" />
                      </div>
                      <div className="font-semibold">
                        {property.squareMeters}m²
                      </div>
                      <div className="text-xs text-muted-foreground">Área</div>
                    </div>

                    {property.garageSpaces > 0 && (
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg mb-2 mx-auto">
                          <Car className="h-4 w-4 text-primary" />
                        </div>
                        <div className="font-semibold">
                          {property.garageSpaces}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Vagas
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  {property.features && property.features.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Características</h4>
                      <div className="flex flex-wrap gap-2">
                        {property.features.map((feature, index) => (
                          <Badge key={index} variant="outline">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Agent Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Información del Agente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Agent Info */}
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={property.agent.avatarUrl || ""} />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">
                          {property.agent.firstName} {property.agent.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Building2 className="h-3 w-3 mr-1" />
                          {property.agency.name}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Contact Buttons */}
                    <div className="space-y-2">
                      {property.agent.phone && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleContactPhone}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Llamar
                        </Button>
                      )}
                      {property.agent.whatsapp && (
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={handleContactWhatsApp}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          WhatsApp
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <strong>Barrio:</strong> {property.locationNeigh}
                  </div>
                  <div>
                    <strong>Ciudad:</strong> {property.locationCity}
                  </div>
                  <div>
                    <strong>Estado:</strong> {property.locationState}
                  </div>
                  {property.address && (
                    <div>
                      <strong>Dirección:</strong> {property.address}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Property Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Información Técnica</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      ID de la Propiedad:
                    </span>
                    <span className="font-mono">{property.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado:</span>
                    <span>{getStatusBadge(property.status)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span>{getPropertyTypeLabel(property.type)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transacción:</span>
                    <span>
                      {property.transactionType === "SALE"
                        ? "Venta"
                        : "Alquiler"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Publicado:</span>
                    <span>
                      {new Date(property.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agencia:</span>
                    <span>{property.agency.name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Gallery Modal */}
      <Dialog open={showImageGallery} onOpenChange={setShowImageGallery}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <img
              src={property.images[currentImageIndex]}
              alt={`${property.title} - Imagen ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            {/* Navigation */}
            {property.images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full">
              {currentImageIndex + 1} / {property.images.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
