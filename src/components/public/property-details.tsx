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
import { PropertyPdfDownload } from "./property-pdf-download";
import {
  PropertySingleMap,
  type PropertySingleMapHandle,
} from "./property-single-map";
import Image from "next/image";
import type { PropertyType, TransactionType } from "@prisma/client";
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
  ArrowLeft,
  Building2,
} from "lucide-react";

interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  locationState: string;
  locationCity: string;
  locationNeigh: string;
  address: string | null;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  price: number;
  currency: string;
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

interface PropertyDetailsProps {
  propertyId: string;
}

export function PropertyDetails({ propertyId }: PropertyDetailsProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [mapView, setMapView] = useState<{
    centerLat: number;
    centerLng: number;
    zoom: number;
  } | null>(null);
  const mapRef = React.useRef<PropertySingleMapHandle | null>(null);
  const [mapSnapshot, setMapSnapshot] = useState<string | null>(null);

  // Fetch property details
  const {
    data: property,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["property-details", propertyId],
    queryFn: async (): Promise<Property> => {
      const response = await fetch(`/api/properties/${propertyId}`);
      if (!response.ok) {
        throw new Error("Property not found");
      }
      const data = await response.json();
      return data.property;
    },
  });

  const formatPrice = (
    price: number,
    currency: string,
    exchangeRate: number | null,
    transactionType: string
  ) => {
    if (currency === "DOLLARS") {
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(price);

      if (exchangeRate) {
        const bolivianosPrice = price * exchangeRate;
        const bolivianosFormatted = new Intl.NumberFormat("es-BO", {
          style: "currency",
          currency: "BOB",
        }).format(bolivianosPrice);

        const result = `${formatted} (≈ ${bolivianosFormatted})`;
        return transactionType === "RENT" ? `${result}/mes` : result;
      }

      return transactionType === "RENT" ? `${formatted}/mes` : formatted;
    } else {
      const formatted = new Intl.NumberFormat("es-BO", {
        style: "currency",
        currency: "BOB",
      }).format(price);

      if (exchangeRate) {
        const dollarsPrice = price / exchangeRate;
        const dollarsFormatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(dollarsPrice);

        const result = `${formatted} (≈ ${dollarsFormatted})`;
        return transactionType === "RENT" ? `${result}/mes` : result;
      }

      return transactionType === "RENT" ? `${formatted}/mes` : formatted;
    }
  };

  const getTransactionBadge = (type: string) => {
    let label = "Alquiler";
    let variant: "default" | "secondary" = "secondary";
    let className = "bg-green-600 hover:bg-green-700 text-white";

    switch (type) {
      case "SALE":
        label = "Venta";
        variant = "default";
        className = "bg-primary hover:bg-primary/90";
        break;
      case "RENT":
        label = "Alquiler";
        variant = "secondary";
        className = "bg-green-600 hover:bg-green-700 text-white";
        break;
      case "ANTICRÉTICO":
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

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "SALE":
        return "Venta";
      case "RENT":
        return "Alquiler";
      case "ANTICRÉTICO":
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
        property.currency,
        property.exchangeRate,
        property.transactionType
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

  const captureMapSnapshot = async () => {
    try {
      await mapRef.current?.awaitReady();
      const dataUrl = await mapRef.current?.getSnapshot();
      if (dataUrl) setMapSnapshot(dataUrl);
      return dataUrl ?? null;
    } catch {
      return null;
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
    return <div>Loading...</div>; // This will be replaced by the Suspense fallback
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <CardContent>
            <Home className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Propiedad no encontrada
            </h3>
            <p className="text-muted-foreground mb-4">
              La propiedad solicitada no fue encontrada o ya no está disponible.
            </p>
            <Button onClick={() => (window.location.href = "/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a la búsqueda
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Favorito
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Compartir
              </Button>
              {property && (
                <div className="flex items-center gap-2">
                  <PropertyPdfDownload
                    property={property}
                    variant="header"
                    mapView={mapView}
                    mapSnapshotDataUrl={mapSnapshot}
                    onBeforeGenerate={captureMapSnapshot}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">
                {property.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>
                    {property.locationNeigh}, {property.locationCity} -{" "}
                    {property.locationState}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getTransactionBadge(property.transactionType)}
                  <Badge variant="outline">
                    {getPropertyTypeLabel(property.type)}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="md:text-right">
              <div className="text-2xl md:text-3xl font-bold text-primary mb-0.5 md:mb-1">
                {formatPrice(
                  property.price,
                  property.currency,
                  property.exchangeRate,
                  property.transactionType
                )}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                {property.squareMeters}m² • Publicado el{" "}
                {new Date(property.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Image Gallery and Contact */}
        <div className="mb-8">
          {property.images.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Property Images */}
              <div className="lg:col-span-3">
                {property.images.length === 1 ? (
                  /* Single Image Layout: Full width */
                  <div className="h-full">
                    <div
                      className="relative w-full h-full rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setShowImageGallery(true)}
                    >
                      <Image
                        src={property.images[0]}
                        alt={`${property.title} - Imagen principal`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  /* Multiple Images Layout: Main image + thumbnails */
                  <div className="grid grid-cols-3 gap-4 h-full">
                    {/* Main Image - spans 2 columns */}
                    <div className="col-span-2 h-full">
                      <div
                        className="relative w-full h-full rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setShowImageGallery(true)}
                      >
                        <Image
                          src={property.images[0]}
                          alt={`${property.title} - Imagen principal`}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
                          1 / {property.images.length}
                        </div>
                      </div>
                    </div>

                    {/* Thumbnails Column */}
                    <div className="grid grid-rows-3 gap-4 h-full">
                      {/* Thumbnail 2 */}
                      {property.images.length > 1 && (
                        <div className="h-full">
                          <div
                            className="relative w-full h-full rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              setCurrentImageIndex(1);
                              setShowImageGallery(true);
                            }}
                          >
                            <Image
                              src={property.images[1]}
                              alt={`${property.title} - Imagen 2`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>
                      )}

                      {/* Thumbnail 3 */}
                      {property.images.length > 2 && (
                        <div className="h-full">
                          <div
                            className="relative w-full h-full rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              setCurrentImageIndex(2);
                              setShowImageGallery(true);
                            }}
                          >
                            <Image
                              src={property.images[2]}
                              alt={`${property.title} - Imagen 3`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>
                      )}

                      {/* Thumbnail 4 or Overflow */}
                      {property.images.length > 3 && (
                        <div className="h-full">
                          <div
                            className="relative w-full h-full rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              setCurrentImageIndex(3);
                              setShowImageGallery(true);
                            }}
                          >
                            <Image
                              src={property.images[3]}
                              alt={`${property.title} - ${property.images.length === 4 ? "Imagen 4" : "Más imágenes"}`}
                              fill
                              className="object-cover"
                            />
                            {property.images.length > 4 && (
                              <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white font-medium">
                                +{property.images.length - 4}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Contact and Info Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Agent Contact */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contacta al agente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Agent Info */}
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={property.agent.avatarUrl || ""} />
                        <AvatarFallback>
                          {property.agent.firstName?.[0]}
                          {property.agent.lastName?.[0]}
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
                    <div className="space-y-3">
                      {property.agent.phone && (
                        <Button
                          onClick={handleContactWhatsApp}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          WhatsApp
                        </Button>
                      )}

                      {property.agent.phone && (
                        <Button
                          onClick={handleContactPhone}
                          variant="outline"
                          className="w-full"
                        >
                          <Phone className="mr-2 h-4 w-4" />
                          Llamar
                        </Button>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground text-center pt-2">
                      Al contactar, menciona que viste esta propiedad en
                      UbiGroup
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Información rápida</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="font-medium">
                        {getPropertyTypeLabel(property.type)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Transacción:
                      </span>
                      <span className="font-medium">
                        {getTransactionTypeLabel(property.transactionType)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Publicado:</span>
                      <span className="font-medium">
                        {new Date(property.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* PDF Download Button */}
                    <div className="pt-3 border-t">
                      <PropertyPdfDownload
                        property={property}
                        variant="sidebar"
                        mapView={mapView}
                        mapSnapshotDataUrl={mapSnapshot}
                        onBeforeGenerate={captureMapSnapshot}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="aspect-[4/3] rounded-lg bg-muted flex items-center justify-center border border-border">
              <div className="text-center">
                <Home className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  Sin imágenes disponibles
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-8">
          {/* Property Information */}
          <div className="space-y-6">
            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Propiedad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-2 mx-auto">
                      <Bed className="h-6 w-6 text-primary" />
                    </div>
                    <div className="font-semibold">{property.bedrooms}</div>
                    <div className="text-sm text-muted-foreground">
                      Habitaciones
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-2 mx-auto">
                      <Bath className="h-6 w-6 text-primary" />
                    </div>
                    <div className="font-semibold">{property.bathrooms}</div>
                    <div className="text-sm text-muted-foreground">Baños</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-2 mx-auto">
                      <Square className="h-6 w-6 text-primary" />
                    </div>
                    <div className="font-semibold">
                      {property.squareMeters}m²
                    </div>
                    <div className="text-sm text-muted-foreground">Área</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-2 mx-auto">
                      <Car className="h-6 w-6 text-primary" />
                    </div>
                    <div className="font-semibold">{property.garageSpaces}</div>
                    <div className="text-sm text-muted-foreground">
                      Parqueos
                    </div>
                  </div>
                </div>

                {/* Features */}
                {property.features.length > 0 && (
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

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm md:text-base">
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
                <div className="space-y-2 mb-4">
                  <div>
                    <strong>Barrio:</strong> {property.locationNeigh}
                  </div>
                  <div>
                    <strong>Ciudad:</strong> {property.locationCity}
                  </div>
                  <div>
                    <strong>Departamento:</strong> {property.locationState}
                  </div>
                  {property.address && (
                    <div>
                      <strong>Dirección:</strong> {property.address}
                    </div>
                  )}
                </div>

                {/* Map */}
                <PropertySingleMap
                  ref={mapRef}
                  property={{
                    ...property,
                    customId: property.id, // Use id as customId if not available
                    latitude: property.latitude || undefined,
                    longitude: property.longitude || undefined,
                    municipality: property.locationCity, // Use locationCity as municipality
                    address: property.address || undefined,
                    exchangeRate: property.exchangeRate || undefined,
                    googleMapsUrl: property.googleMapsUrl || undefined,
                    status: property.status as
                      | "PENDING"
                      | "APPROVED"
                      | "REJECTED",
                    agent: {
                      firstName: property.agent.firstName || undefined,
                      lastName: property.agent.lastName || undefined,
                      phone: property.agent.phone || undefined,
                    },
                    agency: {
                      name: property.agency.name,
                      logoUrl: property.agency.logoUrl || undefined,
                    },
                  }}
                  onViewChange={setMapView}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      <Dialog open={showImageGallery} onOpenChange={setShowImageGallery}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{property.title}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <Image
              src={property.images[currentImageIndex]}
              alt={`${property.title} - Imagen ${currentImageIndex + 1}`}
              fill
              className="object-contain"
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
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full font-medium">
              {currentImageIndex + 1} / {property.images.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
