"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {  CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyCard } from "./property-card";
import { PropertyFilters } from "./property-filters";
import { PropertySearchBar } from "./property-search-bar";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Grid3X3,
  List,
  SlidersHorizontal,
  MapPin,
  Home,
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
}

interface PropertyFilters {
  transactionType?: "SALE" | "RENT" | "";
  type?: "HOUSE" | "APARTMENT" | "OFFICE" | "LAND" | "";
  locationState?: string;
  locationCity?: string;
  locationNeigh?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minSquareMeters?: number;
  maxSquareMeters?: number;
  features?: string[];
}

export function PublicPropertyCatalog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const isMobile = useIsMobile();

  // Fetch properties with search and filters
  const {
    data: properties = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["public-properties", searchQuery, filters],
    queryFn: async (): Promise<Property[]> => {
      const params = new URLSearchParams();

      // Add search query
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      // Add filters with proper mapping for API
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(`${key}[]`, v));
          } else {
            // Map frontend filter names to API parameter names
            let apiKey = key;
            if (key === "bedrooms") apiKey = "minBedrooms";
            if (key === "bathrooms") apiKey = "minBathrooms";

            params.append(apiKey, value.toString());
          }
        }
      });

      // Only get approved properties for public view
      params.append("status", "APPROVED");

      const response = await fetch(`/api/properties?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch properties");
      }
      const data = await response.json();
      return data.properties || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFiltersChange = (newFilters: PropertyFilters) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery("");
  };

  const getResultsText = () => {
    const count = properties.length;
    if (count === 0) return "Nenhum imóvel encontrado";
    if (count === 1) return "1 imóvel encontrado";
    return `${count} imóveis encontrados`;
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Erro ao carregar propriedades
            </h3>
            <p className="text-muted-foreground mb-4">
              Não foi possível carregar os imóveis. Tente novamente.
            </p>
            <Button onClick={() => window.location.reload()}>
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          {/* Title and Logo */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <Home className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">UbiGroup</h1>
                <p className="text-sm text-muted-foreground">
                  Encontre seu imóvel ideal
                </p>
              </div>
            </div>

            {/* Authentication Link */}
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/sign-in")}
              className="hidden sm:flex"
            >
              Acessar Dashboard
            </Button>
          </div>

          {/* Search Bar */}
          <PropertySearchBar
            value={searchQuery}
            onSearch={handleSearch}
            placeholder="Buscar por cidade, bairro, tipo de imóvel..."
            className="mb-4"
          />

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {!isMobile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Filtros</span>
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                {getResultsText()}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="p-2"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="p-2"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar - Desktop */}
          {!isMobile && (
            <div
              className={`transition-all duration-300 ${showFilters ? "w-80" : "w-0"} overflow-hidden`}
            >
              {showFilters && (
                <div className="sticky top-24">
                  <PropertyFilters
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    onClearFilters={clearFilters}
                  />
                </div>
              )}
            </div>
          )}

          {/* Properties Grid/List */}
          <div className="flex-1">
            {isMobile && (
              <div className="mb-4">
                <PropertyFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onClearFilters={clearFilters}
                  isMobile={true}
                />
              </div>
            )}

            {isLoading ? (
              <div
                className={`grid gap-6 ${
                  viewMode === "grid"
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                    : "grid-cols-1"
                }`}
              >
                {Array.from({ length: 9 }).map((_, index) => (
                  <Card key={index} className="overflow-hidden">
                    <Skeleton className="aspect-[4/3] w-full" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Nenhum imóvel encontrado
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || Object.keys(filters).length > 0
                    ? "Tente ajustar seus filtros de busca para encontrar mais opções."
                    : "Não há imóveis disponíveis no momento."}
                </p>
                {(searchQuery || Object.keys(filters).length > 0) && (
                  <Button onClick={clearFilters} variant="outline">
                    Limpar Filtros
                  </Button>
                )}
              </div>
            ) : (
              <div
                className={`grid gap-6 ${
                  viewMode === "grid"
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                    : "grid-cols-1"
                }`}
              >
                {properties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    className={
                      viewMode === "list" ? "md:flex md:max-w-none" : ""
                    }
                  />
                ))}
              </div>
            )}

            {/* Load More / Pagination could go here */}
            {properties.length > 0 && (
              <div className="mt-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Mostrando {properties.length} imóveis
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-muted/50 border-t mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Home className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">UbiGroup</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Plataforma completa para gestão imobiliária com tecnologia
                avançada.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Para Compradores</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Buscar Imóveis</li>
                <li>Calculadora de Financiamento</li>
                <li>Guia do Comprador</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Para Profissionais</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/sign-in" className="hover:text-primary">
                    Acessar Dashboard
                  </a>
                </li>
                <li>Cadastrar Imóveis</li>
                <li>Gerenciar Leads</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Contato</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>support@ubigroup.com</li>
                <li>+55 (11) 9999-9999</li>
                <li>Segunda a Sexta, 9h às 18h</li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 UbiGroup. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
