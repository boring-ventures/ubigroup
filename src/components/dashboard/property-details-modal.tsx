"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
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
  Phone,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  Building2,
  Eye,
  User,
  X,
} from "lucide-react";
import { Currency, TransactionType } from "@prisma/client";

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
  currency: Currency;
  exchangeRate: number | null;
  bedrooms: number;
  bathrooms: number;
  garageSpaces: number;
  squareMeters: number;
  transactionType: TransactionType;
  status: string;
  rejectionMessage?: string | null;
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

  const getCurrencyCode = (currency: Currency): string => {
    switch (currency) {
      case Currency.BOLIVIANOS:
        return "BOB";
      case Currency.DOLLARS:
        return "USD";
      default:
        return "BOB";
    }
  };

  const formatPrice = (
    price: number,
    transactionType: TransactionType,
    currency: Currency = Currency.BOLIVIANOS
  ) => {
    const currencyCode = getCurrencyCode(currency);
    const formatted = new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: currencyCode,
    }).format(price);

    return transactionType === TransactionType.RENT
      ? `${formatted}/mes`
      : formatted;
  };

  const getTransactionBadge = (type: TransactionType) => {
    let label = "Alquiler";
    let variant: "default" | "secondary" = "secondary";
    let className = "bg-green-600 hover:bg-green-700 text-white";

    switch (type) {
      case TransactionType.SALE:
        label = "Venta";
        variant = "default";
        className = "bg-blue-600 hover:bg-blue-700";
        break;
      case TransactionType.RENT:
        label = "Alquiler";
        variant = "secondary";
        className = "bg-green-600 hover:bg-green-700 text-white";
        break;
      case TransactionType.ANTICRÉTICO:
        label = "Anticrético";
        variant = "secondary";
        className = "bg-purple-600 hover:bg-purple-700 text-white";
        break;
      default:
        label = "Alquiler";
        variant = "secondary";
        className = "bg-green-600 hover:bg-green-700 text-white";
    }

    return (
      <Badge variant={variant} className={className}>
        {label}
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

  const getTransactionTypeLabel = (type: TransactionType) => {
    switch (type) {
      case TransactionType.SALE:
        return "Venta";
      case TransactionType.RENT:
        return "Alquiler";
      case TransactionType.ANTICRÉTICO:
        return "Anticrético";
      default:
        return "Alquiler";
    }
  };

  const handleContactWhatsApp = () => {
    if (property?.agent.phone) {
      const propertyUrl = `https://ubigroup.vercel.app/property/${property.id}`;
      const price = formatPrice(
        property.price,
        property.transactionType,
        property.currency
      );
      const location = `${property.locationCity}, ${property.locationState}`;
      const transactionType = getTransactionTypeLabel(property.transactionType);
      const propertyType = getPropertyTypeLabel(property.type);

      const message = `Hola, me interesa obtener más información sobre esta propiedad:

🏠 ${property.title}
📍 ${location}
💰 ${price}
🏢 ${propertyType} - ${transactionType}
🔗 ${propertyUrl}

¿Podrías proporcionarme más detalles?`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${property.agent.phone.replace(/\D/g, "")}?text=${encodedMessage}`;
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

                {/* Rejection Reason */}
                {property.status === "REJECTED" &&
                  property.rejectionMessage && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-red-600 text-sm">!</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-red-800 mb-1">
                            Motivo de Rechazo
                          </h4>
                          <p className="text-sm text-red-700">
                            {property.rejectionMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary mb-1">
                  {formatPrice(
                    property.price,
                    property.transactionType,
                    property.currency
                  )}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {property.images.slice(0, 4).map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer group"
                      onClick={() => {
                        setCurrentImageIndex(index);
                        setShowImageGallery(true);
                      }}
                    >
                      <Image
                        src={image}
                        alt={`${property.title} - Imagen ${index + 1}`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-inline-size: 640px) 100vw, (max-inline-size: 1024px) 50vw, (max-inline-size: 1280px) 33vw, 25vw"
                      />
                    </div>
                  ))}
                  {property.images.length > 4 && (
                    <div
                      className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer group"
                      onClick={() => setShowImageGallery(true)}
                    >
                      <Image
                        src={property.images[4]}
                        alt={`${property.title} - Más imágenes`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-inline-size: 640px) 100vw, (max-inline-size: 1024px) 50vw, (max-inline-size: 1280px) 33vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-white font-semibold text-lg">
                            +{property.images.length - 4}
                          </span>
                          <p className="text-white text-sm">más fotos</p>
                        </div>
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
                      {property.agent.phone && (
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
                      {getTransactionTypeLabel(property.transactionType)}
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
        <DialogContent className="max-w-6xl w-full h-[90vh] p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Galería de Imágenes - {property?.title}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <div className="relative w-full h-full max-w-5xl max-h-[85vh]">
              <Image
                src={property.images[currentImageIndex]}
                alt={`${property.title} - Imagen ${currentImageIndex + 1}`}
                fill
                className="object-contain"
                sizes="90vw"
                priority
              />
            </div>

            {/* Navigation */}
            {property.images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm font-medium">
              {currentImageIndex + 1} / {property.images.length}
            </div>

            {/* Close button */}
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4 z-10"
              onClick={() => setShowImageGallery(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
