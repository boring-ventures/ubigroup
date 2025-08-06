"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PropertyPdfDownload } from "./property-pdf-download";
import { PropertySingleMap } from "./property-single-map";
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
    whatsapp: string | null;
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
    return (
      <Badge
        variant={type === "SALE" ? "default" : "secondary"}
        className={`${
          type === "SALE"
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-green-600 hover:bg-green-700 text-white"
        }`}
      >
        {type === "SALE" ? "Venda" : "Aluguel"}
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
        return "Escritório";
      case "LAND":
        return "Terreno";
      default:
        return type;
    }
  };

  const handleContactWhatsApp = () => {
    if (property?.agent.whatsapp) {
      const message = encodeURIComponent(
        `Olá! Tenho interesse no imóvel "${property.title}" (ID: ${property.id}). Poderia me fornecer mais informações?`
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
    return <div>Loading...</div>; // This will be replaced by the Suspense fallback
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <CardContent>
            <Home className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Imóvel não encontrado
            </h3>
            <p className="text-muted-foreground mb-4">
              O imóvel solicitado não foi encontrado ou não está mais
              disponível.
            </p>
            <Button onClick={() => (window.location.href = "/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para a busca
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Favoritar
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
              {property && (
                <PropertyPdfDownload property={property} variant="header" />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
              <div className="flex items-center space-x-4 text-muted-foreground">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>
                    {property.locationNeigh}, {property.locationCity} -{" "}
                    {property.locationState}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {getTransactionBadge(property.transactionType)}
                  <Badge variant="outline">
                    {getPropertyTypeLabel(property.type)}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary mb-1">
                {formatPrice(
                  property.price,
                  property.currency,
                  property.exchangeRate,
                  property.transactionType
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {property.squareMeters}m² • Publicado em{" "}
                {new Date(property.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Image Gallery */}
        <div className="mb-8">
          {property.images.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Main Image */}
              <div className="lg:col-span-2">
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted group cursor-pointer">
                  <Image
                    src={property.images[currentImageIndex]}
                    alt={`${property.title} - Imagem ${currentImageIndex + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    onClick={() => setShowImageGallery(true)}
                  />

                  {/* Navigation Arrows */}
                  {property.images.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage();
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage();
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}

                  {/* Image Counter */}
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {property.images.length}
                  </div>
                </div>
              </div>

              {/* Thumbnail Grid */}
              <div className="space-y-4">
                {property.images.slice(1, 3).map((image, index) => (
                  <div
                    key={index}
                    className="aspect-[4/3] rounded-lg overflow-hidden bg-muted cursor-pointer group"
                    onClick={() => {
                      setCurrentImageIndex(index + 1);
                      setShowImageGallery(true);
                    }}
                  >
                    <Image
                      src={image}
                      alt={`${property.title} - Imagem ${index + 2}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ))}

                {property.images.length > 3 && (
                  <div
                    className="aspect-[4/3] rounded-lg overflow-hidden bg-muted cursor-pointer group relative"
                    onClick={() => setShowImageGallery(true)}
                  >
                    <Image
                      src={property.images[3]}
                      alt={`${property.title} - Mais imagens`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-semibold">
                        +{property.images.length - 3} fotos
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="aspect-[4/3] rounded-lg bg-muted flex items-center justify-center">
              <div className="text-center">
                <Home className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Sem imagens disponíveis</p>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Property Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Imóvel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  {property.bedrooms > 0 && (
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-2">
                        <Bed className="h-6 w-6 text-primary" />
                      </div>
                      <div className="font-semibold">{property.bedrooms}</div>
                      <div className="text-sm text-muted-foreground">
                        Quartos
                      </div>
                    </div>
                  )}

                  {property.bathrooms > 0 && (
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-2">
                        <Bath className="h-6 w-6 text-primary" />
                      </div>
                      <div className="font-semibold">{property.bathrooms}</div>
                      <div className="text-sm text-muted-foreground">
                        Banheiros
                      </div>
                    </div>
                  )}

                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-2">
                      <Square className="h-6 w-6 text-primary" />
                    </div>
                    <div className="font-semibold">
                      {property.squareMeters}m²
                    </div>
                    <div className="text-sm text-muted-foreground">Área</div>
                  </div>

                  {property.garageSpaces > 0 && (
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-2">
                        <Car className="h-6 w-6 text-primary" />
                      </div>
                      <div className="font-semibold">
                        {property.garageSpaces}
                      </div>
                      <div className="text-sm text-muted-foreground">Vagas</div>
                    </div>
                  )}
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
                <CardTitle>Descrição</CardTitle>
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
                  Localização
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div>
                    <strong>Bairro:</strong> {property.locationNeigh}
                  </div>
                  <div>
                    <strong>Cidade:</strong> {property.locationCity}
                  </div>
                  <div>
                    <strong>Estado:</strong> {property.locationState}
                  </div>
                  {property.address && (
                    <div>
                      <strong>Endereço:</strong> {property.address}
                    </div>
                  )}
                </div>

                {/* Map */}
                <PropertySingleMap
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
                      whatsapp: property.agent.whatsapp || undefined,
                    },
                    agency: {
                      name: property.agency.name,
                      logoUrl: property.agency.logoUrl || undefined,
                    },
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agent Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Entre em Contato</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
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
                    {property.agent.whatsapp && (
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
                        Ligar
                      </Button>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground text-center pt-2">
                    Ao entrar em contato, mencione que viu este imóvel no
                    UbiGroup
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-medium">
                    {getPropertyTypeLabel(property.type)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transação:</span>
                  <span className="font-medium">
                    {property.transactionType === "SALE" ? "Venda" : "Aluguel"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID do Imóvel:</span>
                  <span className="font-medium font-mono text-sm">
                    {property.id}
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
                  <PropertyPdfDownload property={property} variant="sidebar" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      <Dialog open={showImageGallery} onOpenChange={setShowImageGallery}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <Image
              src={property.images[currentImageIndex]}
              alt={`${property.title} - Imagem ${currentImageIndex + 1}`}
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
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full">
              {currentImageIndex + 1} / {property.images.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
