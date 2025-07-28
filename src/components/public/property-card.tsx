"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Heart,
  Share2,
  Phone,
  MessageCircle,
  Car,
  Building2,
} from "lucide-react";

interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    description: string;
    type: string;
    locationState: string;
    locationCity: string;
    locationNeigh: string;
    address: string | null;
    price: number;
    currency: string;
    exchangeRate: number | null;
    bedrooms: number;
    bathrooms: number;
    garageSpaces: number;
    squareMeters: number;
    transactionType: string;
    images: string[];
    features: string[];
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
  };
  onViewDetails?: (propertyId: string) => void;
  onContactAgent?: (agentId: string, propertyId: string) => void;
  className?: string;
}

export function PropertyCard({
  property,
  onViewDetails,
  onContactAgent,
  className = "",
}: PropertyCardProps) {
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
        className={`absolute top-3 left-3 z-10 ${
          type === "SALE"
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-green-600 hover:bg-green-700 text-white"
        }`}
      >
        {type === "SALE" ? "Venda" : "Aluguel"}
      </Badge>
    );
  };

  const getPropertyTypeIcon = (type: string) => {
    switch (type) {
      case "HOUSE":
        return "🏠";
      case "APARTMENT":
        return "🏢";
      case "OFFICE":
        return "🏢";
      case "LAND":
        return "🌐";
      default:
        return "🏠";
    }
  };

  const handleContactWhatsApp = () => {
    if (property.agent.whatsapp) {
      const message = encodeURIComponent(
        `Olá! Tenho interesse no imóvel "${property.title}" (ID: ${property.id}). Poderia me fornecer mais informações?`
      );
      const whatsappUrl = `https://wa.me/${property.agent.whatsapp.replace(/\D/g, "")}?text=${message}`;
      window.open(whatsappUrl, "_blank");
    }
  };

  const handleContactPhone = () => {
    if (property.agent.phone) {
      window.location.href = `tel:${property.agent.phone}`;
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(property.id);
    }
    // Default behavior is handled by the Link component
  };

  return (
    <Link href={`/property/${property.id}`} className="block">
      <Card
        className={`group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${className}`}
      >
        {/* Property Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {getTransactionBadge(property.transactionType)}

          <img
            src={property.images[0] || "/placeholder-property.jpg"}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Image Navigation Dots */}
          {property.images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {property.images.slice(0, 5).map((_, index) => (
                <div
                  key={index}
                  className="w-2 h-2 rounded-full bg-white/60 backdrop-blur-sm"
                />
              ))}
              {property.images.length > 5 && (
                <span className="text-xs text-white/80 ml-1">
                  +{property.images.length - 5}
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Price and Property Type */}
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold text-primary">
              {formatPrice(
                property.price,
                property.currency,
                property.exchangeRate,
                property.transactionType
              )}
            </div>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <span>{getPropertyTypeIcon(property.type)}</span>
              <span className="capitalize">{property.type.toLowerCase()}</span>
            </div>
          </div>

          {/* Property Title */}
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {property.title}
          </h3>

          {/* Location */}
          <div className="flex items-center text-muted-foreground mb-3">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="text-sm truncate">
              {property.locationNeigh}, {property.locationCity} -{" "}
              {property.locationState}
            </span>
          </div>

          {/* Property Details */}
          <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              {property.bedrooms > 0 && (
                <div className="flex items-center">
                  <Bed className="h-4 w-4 mr-1" />
                  <span>{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="flex items-center">
                  <Bath className="h-4 w-4 mr-1" />
                  <span>{property.bathrooms}</span>
                </div>
              )}
              {property.garageSpaces > 0 && (
                <div className="flex items-center">
                  <Car className="h-4 w-4 mr-1" />
                  <span>{property.garageSpaces}</span>
                </div>
              )}
            </div>
            <div className="flex items-center">
              <Square className="h-4 w-4 mr-1" />
              <span>{property.squareMeters}m²</span>
            </div>
          </div>

          {/* Features */}
          {property.features.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {property.features.slice(0, 3).map((feature, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
                {property.features.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{property.features.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Agent Information */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={property.agent.avatarUrl || ""} />
                <AvatarFallback>
                  {property.agent.firstName?.[0]}
                  {property.agent.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium">
                  {property.agent.firstName} {property.agent.lastName}
                </div>
                <div className="text-xs text-muted-foreground flex items-center">
                  <Building2 className="h-3 w-3 mr-1" />
                  {property.agency.name}
                </div>
              </div>
            </div>

            {/* Contact Buttons */}
            <div className="flex space-x-2">
              {property.agent.phone && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleContactPhone();
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Phone className="h-4 w-4" />
                </Button>
              )}
              {property.agent.whatsapp && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleContactWhatsApp();
                  }}
                  className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="h-4 w-4 text-white" />
                </Button>
              )}
            </div>
          </div>

          {/* View Details Button */}
          <Button
            className="w-full mt-4"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleViewDetails();
            }}
          >
            Ver Detalhes
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}
