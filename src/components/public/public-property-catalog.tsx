"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyCard } from "./property-card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { PropertyFilters } from "./property-filters";
import { PropertySearchBar } from "./property-search-bar";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Grid3X3,
  List,
  SlidersHorizontal,
  MapPin,
  Home,
  Building2,
  Layers,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
}

interface PublicPropertyFilters {
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
  const [filters, setFilters] = useState<PublicPropertyFilters>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "venta" | "alquiler" | "anticretico" | "proyectos"
  >("venta");
  const isMobile = useIsMobile();

  // Fetch properties with search and filters
  const {
    data: properties = [],
    isLoading: propertiesLoading,
    error: propertiesError,
  } = useQuery({
    queryKey: ["public-properties", searchQuery, filters, activeTab],
    queryFn: async (): Promise<Property[]> => {
      const params = new URLSearchParams();

      // Add search query
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      // Add filters with proper mapping for API (exclude transactionType; controlled by tab)
      Object.entries(filters)
        .filter(([key]) => key !== "transactionType")
        .forEach(([key, value]) => {
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

      // Map tab to transaction type
      const tabToTransaction: Record<string, string> = {
        venta: "SALE",
        alquiler: "RENT",
        anticretico: "ANTICRÉTICO",
      };
      if (activeTab !== "proyectos") {
        params.append("transactionType", tabToTransaction[activeTab]);
      }

      const response = await fetch(`/api/properties?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch properties");
      }
      const data = await response.json();
      return data.properties || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: activeTab !== "proyectos",
  });

  // Fetch projects
  interface PublicProject {
    id: string;
    name: string;
    description: string;
    location: string;
    propertyType: string;
    images: string[];
    active: boolean;
    floors?: Array<{
      id: string;
      number: number;
      name: string | null;
      quadrants?: Array<{
        id: string;
        customId: string;
        status: string;
      }>;
    }>;
  }
  const {
    data: projects = [],
    isLoading: projectsLoading,
    error: projectsError,
  } = useQuery({
    queryKey: ["public-projects", searchQuery],
    queryFn: async (): Promise<PublicProject[]> => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const response = await fetch(`/api/public/projects?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await response.json();
      return data.projects || [];
    },
    enabled: activeTab === "proyectos",
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFiltersChange = (newFilters: PublicPropertyFilters) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery("");
  };

  const getResultsText = () => {
    if (activeTab !== "proyectos") {
      const count = properties.length;
      if (count === 0) return "Ninguna propiedad encontrada";
      if (count === 1) return "1 propiedad encontrada";
      return `${count} propiedades encontradas`;
    } else {
      const count = projects.length;
      if (count === 0) return "Ningún proyecto encontrado";
      if (count === 1) return "1 proyecto encontrado";
      return `${count} proyectos encontrados`;
    }
  };

  const isLoading =
    activeTab !== "proyectos" ? propertiesLoading : projectsLoading;
  const error = activeTab !== "proyectos" ? propertiesError : projectsError;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Error al cargar{" "}
              {activeTab !== "proyectos" ? "propiedades" : "proyectos"}
            </h3>
            <p className="text-muted-foreground mb-4">
              No fue posible cargar los{" "}
              {activeTab !== "proyectos" ? "propiedades" : "proyectos"}.
              Inténtalo de nuevo.
            </p>
            <Button onClick={() => window.location.reload()}>
              Intentar de nuevo
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
                  Encuentra tu propiedad ideal
                </p>
              </div>
            </div>

            {/* Authentication Link */}
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/sign-in")}
              className="hidden sm:flex"
            >
              Acceder al panel
            </Button>
          </div>

          {/* Search Bar */}
          <PropertySearchBar
            value={searchQuery}
            onSearch={handleSearch}
            placeholder="Buscar por ciudad, barrio, tipo de propiedad..."
            className="mb-4"
          />

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="venta" aria-label="Propiedades en venta">
                Venta
              </TabsTrigger>
              <TabsTrigger
                value="alquiler"
                aria-label="Propiedades en alquiler"
              >
                Alquiler
              </TabsTrigger>
              <TabsTrigger
                value="anticretico"
                aria-label="Propiedades en anticrético"
              >
                Anticrético
              </TabsTrigger>
              <TabsTrigger value="proyectos" aria-label="Proyectos">
                Proyectos
              </TabsTrigger>
            </TabsList>
          </Tabs>

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

            {activeTab !== "proyectos" ? (
              <>
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
                      Ninguna propiedad encontrada
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || Object.keys(filters).length > 0
                        ? "Intenta ajustar tus filtros de búsqueda para encontrar más opciones."
                        : "No hay propiedades disponibles en este momento."}
                    </p>
                    {(searchQuery || Object.keys(filters).length > 0) && (
                      <Button onClick={clearFilters} variant="outline">
                        Limpiar filtros
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
                      Mostrando {properties.length} propiedades
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {isLoading ? (
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
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
                ) : projects.length === 0 ? (
                  <div className="text-center py-12">
                    <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Ningún proyecto encontrado
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery
                        ? "Intenta ajustar tu búsqueda para encontrar más opciones."
                        : "No hay proyectos disponibles en este momento."}
                    </p>
                    {searchQuery && (
                      <Button
                        onClick={() => setSearchQuery("")}
                        variant="outline"
                      >
                        Limpiar búsqueda
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                      <Card
                        key={project.id}
                        className="overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div className="aspect-[4/3] relative overflow-hidden">
                          {project.images && project.images.length > 0 ? (
                            <Image
                              src={project.images[0]}
                              alt={project.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Building2 className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg line-clamp-1">
                              {project.name}
                            </h3>
                            <Badge
                              variant={project.active ? "default" : "secondary"}
                            >
                              {project.active ? "Activo" : "Inactivo"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {project.description}
                          </p>
                          <div className="flex items-center text-sm text-muted-foreground mb-3">
                            <MapPin className="mr-1 h-4 w-4" />
                            {project.location}
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Tipo:</span>
                            <Badge variant="outline">
                              {project.propertyType}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm mt-2">
                            <span className="text-muted-foreground">
                              Pisos:
                            </span>
                            <span className="font-medium">
                              {project.floors?.length || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm mt-2">
                            <span className="text-muted-foreground">
                              Cuadrantes:
                            </span>
                            <span className="font-medium">
                              {project.floors?.reduce(
                                (total, floor) =>
                                  total + (floor.quadrants?.length || 0),
                                0
                              ) || 0}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {projects.length > 0 && (
                  <div className="mt-12 text-center">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {projects.length} proyectos
                    </p>
                  </div>
                )}
              </>
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
                Plataforma completa para gestión inmobiliaria con tecnología
                avanzada.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Para compradores</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Buscar Propiedades</li>
                <li>Calculadora de financiamiento</li>
                <li>Guía del comprador</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Para profesionales</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/sign-in" className="hover:text-primary">
                    Acceder al panel
                  </a>
                </li>
                <li>Registrar Propiedades</li>
                <li>Gestionar leads</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Contacto</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>support@ubigroup.com</li>
                <li>+55 (11) 9999-9999</li>
                <li>Lunes a Viernes, 9h a 18h</li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 UbiGroup. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
