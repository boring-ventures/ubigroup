"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Car,
  Phone,
  MessageCircle,
  ChevronLeft,
  Home,
  Building2,
  Edit,
  Save,
  X,
  User,
  DollarSign,
  Coins,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { UserRole, Currency, TransactionType } from "@prisma/client";
import Link from "next/link";
import { PropertySingleMap } from "./property-single-map";
import { HorizontalImageGallery } from "@/components/ui/horizontal-image-gallery";
import { ImageCarouselModal } from "@/components/ui/image-carousel-modal";

interface Property {
  id: string;
  title: string;
  description: string;
  type: string;
  locationState: string;
  locationCity: string;
  locationNeigh: string;
  address?: string;
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

interface PropertyDetailPageProps {
  propertyId: string;
  userRole: UserRole;
  initialProperty?: Property;
}

export function PropertyDetailPage({
  propertyId,
  userRole,
  initialProperty,
}: PropertyDetailPageProps) {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Property>>({});
  const queryClient = useQueryClient();

  // Use initial property data if available, otherwise fetch from API
  const {
    data: property,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["property-details", propertyId],
    queryFn: async (): Promise<Property> => {
      // If we have initial property data, use it
      if (initialProperty) {
        console.log("Using initial property data:", initialProperty);
        return initialProperty;
      }

      console.log("Fetching property with ID:", propertyId);
      try {
        const response = await fetch(`/api/properties/${propertyId}`);
        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error("API Error:", errorData);
          throw new Error(errorData.error || "Property not found");
        }

        const data = await response.json();
        console.log("Property data received:", data);

        if (!data.property) {
          throw new Error("No property data in response");
        }

        return data.property;
      } catch (error) {
        console.error("Error fetching property:", error);
        throw error;
      }
    },
    initialData: initialProperty,
    retry: 1,
    retryDelay: 1000,
  });

  // Update property mutation
  const updatePropertyMutation = useMutation({
    mutationFn: async (data: Partial<Property>) => {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update property");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["property-details", propertyId],
      });
      toast({
        title: "Éxito",
        description: "Propiedad actualizada exitosamente",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al actualizar la propiedad",
        variant: "destructive",
      });
    },
  });

  const formatPrice = (
    price: number,
    currency: Currency,
    exchangeRate?: number | null
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

        return `${formatted} (≈ ${bolivianosFormatted})`;
      }

      return formatted;
    } else {
      return new Intl.NumberFormat("es-BO", {
        style: "currency",
        currency: "BOB",
      }).format(price);
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
        className = "bg-blue-600 hover:bg-blue-700";
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
        property.exchangeRate
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

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setImageModalOpen(true);
  };

  const handleSave = () => {
    updatePropertyMutation.mutate(editData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Home className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Propiedad no encontrada
          </h3>
          <p className="text-muted-foreground mb-4">
            La propiedad solicitada no fue encontrada o no está disponible.
          </p>
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mt-4">
              <p className="text-sm text-destructive font-mono">
                Error:{" "}
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Property ID: {propertyId}
              </p>
            </div>
          )}
          <Button asChild className="mt-4">
            <Link href="/my-properties">Volver a Mis Propiedades</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/my-properties">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Volver
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Detalles de la Propiedad
              </h1>
              <p className="text-muted-foreground">
                {property.title} • {getPropertyTypeLabel(property.type)}
              </p>
            </div>
          </div>
          {userRole === "AGENT" && property.agent.id === property.agent.id && (
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={updatePropertyMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updatePropertyMutation.isPending
                      ? "Guardando..."
                      : "Guardar"}
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button asChild>
                  <Link href={`/properties/${propertyId}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Property Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <Label htmlFor="title">Título</Label>
                      <Input
                        id="title"
                        value={editData.title || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, title: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        value={editData.description || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            description: e.target.value,
                          })
                        }
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Precio</Label>
                        <Input
                          id="price"
                          type="number"
                          value={editData.price || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              price: parseFloat(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="currency">Moneda</Label>
                        <Select
                          value={editData.currency || "BOLIVIANOS"}
                          onValueChange={(value) =>
                            setEditData({
                              ...editData,
                              currency: value as Currency,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BOLIVIANOS">
                              <div className="flex items-center">
                                <Coins className="h-4 w-4 mr-2" />
                                Bolivianos (Bs)
                              </div>
                            </SelectItem>
                            <SelectItem value="DOLLARS">
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-2" />
                                Dólares ($)
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {editData.currency === "DOLLARS" && (
                      <div>
                        <Label htmlFor="exchangeRate">
                          Tipo de Cambio (Bs/$)
                        </Label>
                        <Input
                          id="exchangeRate"
                          type="number"
                          step="0.01"
                          value={editData.exchangeRate || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              exchangeRate: parseFloat(e.target.value),
                            })
                          }
                          placeholder="Ej: 6.96"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <h3 className="text-xl font-semibold">
                        {property.title}
                      </h3>
                      <p className="text-muted-foreground mt-2">
                        {property.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-primary">
                        {formatPrice(
                          property.price,
                          property.currency,
                          property.exchangeRate
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {getTransactionBadge(property.transactionType)}
                        {getStatusBadge(property.status)}
                      </div>

                      {/* Rejection Reason */}
                      {property.status === "REJECTED" &&
                        property.rejectionMessage && (
                          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <div className="flex-shrink-0">
                                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                  <span className="text-red-600 text-sm">
                                    !
                                  </span>
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
                  </>
                )}
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Propiedad</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="bedrooms">Habitaciones</Label>
                      <Input
                        id="bedrooms"
                        type="number"
                        value={editData.bedrooms || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            bedrooms: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="bathrooms">Baños</Label>
                      <Input
                        id="bathrooms"
                        type="number"
                        value={editData.bathrooms || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            bathrooms: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="garageSpaces">Parqueos</Label>
                      <Input
                        id="garageSpaces"
                        type="number"
                        value={editData.garageSpaces || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            garageSpaces: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="squareMeters">Área (m²)</Label>
                      <Input
                        id="squareMeters"
                        type="number"
                        step="0.01"
                        value={editData.squareMeters || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            squareMeters: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-2 mx-auto">
                        <Bed className="h-6 w-6 text-primary" />
                      </div>
                      <div className="font-semibold">{property.bedrooms}</div>
                      <div className="text-xs text-muted-foreground">
                        Habitaciones
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-2 mx-auto">
                        <Bath className="h-6 w-6 text-primary" />
                      </div>
                      <div className="font-semibold">{property.bathrooms}</div>
                      <div className="text-xs text-muted-foreground">Baños</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-2 mx-auto">
                        <Car className="h-6 w-6 text-primary" />
                      </div>
                      <div className="font-semibold">
                        {property.garageSpaces}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Parqueos
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-2 mx-auto">
                        <Square className="h-6 w-6 text-primary" />
                      </div>
                      <div className="font-semibold">
                        {property.squareMeters}m²
                      </div>
                      <div className="text-xs text-muted-foreground">Área</div>
                    </div>
                  </div>
                )}
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
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address">Dirección Completa</Label>
                      <Input
                        id="address"
                        value={editData.address || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, address: e.target.value })
                        }
                        placeholder="Dirección completa de la propiedad"
                      />
                    </div>
                  </div>
                ) : (
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
                )}
              </CardContent>
            </Card>

            {/* Property Map */}
            <PropertySingleMap property={property} />

            {/* Features */}
            {property.features && property.features.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Características</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {property.features.map((feature, index) => (
                      <Badge key={index} variant="outline">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agent Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Agente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
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

            {/* Property Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Información Técnica</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
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
                    <span className="text-muted-foreground">Estado:</span>
                    <span>{getStatusBadge(property.status)}</span>
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
        </div>

        {/* Image Gallery */}
        {property.images.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <HorizontalImageGallery
                images={property.images}
                onImageClick={handleImageClick}
                title="Imágenes de la propiedad"
              />
            </CardContent>
          </Card>
        )}

        {/* Videos */}
        {property.videos && property.videos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Vídeos</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}
      </div>

      {/* Image Carousel Modal */}
      <ImageCarouselModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        images={property.images}
        initialIndex={selectedImageIndex}
        title={`Imágenes de la propiedad - ${property.title}`}
      />
    </>
  );
}
