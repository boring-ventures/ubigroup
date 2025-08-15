"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Filter,
  ChevronDown,
  MapPin,
  Home,
  Square,
  Settings2,
  DollarSign,
} from "lucide-react";
import { usePropertyLocations } from "@/hooks/use-property-search";

interface LocationCity {
  value: string;
  label: string;
  state: string;
}

interface LocationNeighborhood {
  value: string;
  label: string;
  city: string;
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

interface PropertyFiltersProps {
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
  onClearFilters: () => void;
  className?: string;
  isMobile?: boolean;
}

const FEATURES_OPTIONS = [
  "Piscina",
  "Jardín",
  "Balcón",
  "Parrilla",
  "Gimnasio",
  "Playground",
  "Seguridad 24h",
  "Portería",
  "Ascensor",
  "Aire acondicionado",
  "Muebles empotrados",
  "Chimenea",
  "Sauna",
  "Salón de fiestas",
  "Cancha deportiva",
];

// Dynamic location data will be loaded from API

export function PropertyFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  className = "",
  isMobile = false,
}: PropertyFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Load dynamic location data from API
  const { data: locationData, isLoading: locationsLoading } =
    usePropertyLocations();

  const updateFilter = (
    key: keyof PropertyFilters,
    value: string | number | string[] | undefined
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value === "" ? undefined : value,
    });
  };

  const toggleFeature = (feature: string) => {
    const currentFeatures = filters.features || [];
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter((f) => f !== feature)
      : [...currentFeatures, feature];

    updateFilter("features", newFeatures.length > 0 ? newFeatures : undefined);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.transactionType) count++;
    if (filters.type) count++;
    if (filters.locationState) count++;
    if (filters.locationCity) count++;
    if (filters.locationNeigh) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.bedrooms) count++;
    if (filters.bathrooms) count++;
    if (filters.minSquareMeters || filters.maxSquareMeters) count++;
    if (filters.features && filters.features.length > 0) count++;
    return count;
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Transaction Type */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Tipo de transacción</Label>
        <Select
          value={filters.transactionType || ""}
          onValueChange={(value) => updateFilter("transactionType", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Venta o alquiler" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="SALE">Venta</SelectItem>
            <SelectItem value="RENT">Alquiler</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Property Type */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Tipo de propiedad</Label>
        <Select
          value={filters.type || ""}
          onValueChange={(value) => updateFilter("type", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona el tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="HOUSE">Casa</SelectItem>
            <SelectItem value="APARTMENT">Departamento</SelectItem>
            <SelectItem value="OFFICE">Oficina</SelectItem>
            <SelectItem value="LAND">Terreno</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Location */}
      <div className="space-y-4">
        <Label className="text-base font-medium flex items-center">
          <MapPin className="h-4 w-4 mr-2" />
          Ubicación
        </Label>

        <div className="space-y-3">
          <Select
            value={filters.locationState || ""}
            onValueChange={(value) => updateFilter("locationState", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los departamentos</SelectItem>
              {locationsLoading ? (
                <SelectItem value="" disabled>
                  Cargando departamentos...
                </SelectItem>
              ) : (
                locationData?.states?.map((state: string) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                )) || []
              )}
            </SelectContent>
          </Select>

          <Select
            value={filters.locationCity || ""}
            onValueChange={(value) => updateFilter("locationCity", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Ciudad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas las ciudades</SelectItem>
              {locationsLoading ? (
                <SelectItem value="" disabled>
                  Cargando ciudades...
                </SelectItem>
              ) : (
                locationData?.cities
                  ?.filter(
                    (city: LocationCity) =>
                      !filters.locationState ||
                      city.state === filters.locationState
                  )
                  ?.map((city: LocationCity) => (
                    <SelectItem key={city.value} value={city.value}>
                      {city.label}
                    </SelectItem>
                  )) || []
              )}
            </SelectContent>
          </Select>

          <Select
            value={filters.locationNeigh || ""}
            onValueChange={(value) => updateFilter("locationNeigh", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Barrio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los barrios</SelectItem>
              {locationsLoading ? (
                <SelectItem value="" disabled>
                  Cargando barrios...
                </SelectItem>
              ) : (
                locationData?.neighborhoods
                  ?.filter(
                    (neigh: LocationNeighborhood) =>
                      !filters.locationCity ||
                      neigh.city.includes(filters.locationCity)
                  )
                  ?.map((neigh: LocationNeighborhood) => (
                    <SelectItem key={neigh.value} value={neigh.value}>
                      {neigh.label}
                    </SelectItem>
                  )) || []
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label className="text-base font-medium flex items-center">
          <DollarSign className="h-4 w-4 mr-2" />
          Rango de precio
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Precio mín."
            value={filters.minPrice || ""}
            onChange={(e) =>
              updateFilter(
                "minPrice",
                e.target.value ? parseFloat(e.target.value) : undefined
              )
            }
          />
          <Input
            type="number"
            placeholder="Precio máx."
            value={filters.maxPrice || ""}
            onChange={(e) =>
              updateFilter(
                "maxPrice",
                e.target.value ? parseFloat(e.target.value) : undefined
              )
            }
          />
        </div>
      </div>

      {/* Basic Features */}
      <div className="space-y-4">
        <Label className="text-base font-medium flex items-center">
          <Home className="h-4 w-4 mr-2" />
          Características
        </Label>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Habitaciones</Label>
            <Select
              value={filters.bedrooms?.toString() || ""}
              onValueChange={(value) =>
                updateFilter("bedrooms", value ? parseInt(value) : undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Cualquiera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Cualquiera</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
                <SelectItem value="5">5+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Baños</Label>
            <Select
              value={filters.bathrooms?.toString() || ""}
              onValueChange={(value) =>
                updateFilter("bathrooms", value ? parseInt(value) : undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Cualquiera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Cualquiera</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg border">
          <span className="font-medium">Filtros avanzados</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isAdvancedOpen ? "rotate-180" : ""}`}
          />
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4 space-y-4">
          {/* Area Range */}
          <div className="space-y-2">
            <Label className="text-base font-medium flex items-center">
              <Square className="h-4 w-4 mr-2" />
              Área (m²)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Área mín."
                value={filters.minSquareMeters || ""}
                onChange={(e) =>
                  updateFilter(
                    "minSquareMeters",
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
              />
              <Input
                type="number"
                placeholder="Área máx."
                value={filters.maxSquareMeters || ""}
                onChange={(e) =>
                  updateFilter(
                    "maxSquareMeters",
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
              />
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Características especiales
            </Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {FEATURES_OPTIONS.map((feature) => (
                <div key={feature} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={feature}
                    checked={filters.features?.includes(feature) || false}
                    onChange={() => toggleFeature(feature)}
                  />
                  <Label htmlFor={feature} className="text-sm cursor-pointer">
                    {feature}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Actions */}
      <div className="flex space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onClearFilters} className="flex-1">
          Limpiar filtros
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className={`relative ${className}`}>
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {getActiveFiltersCount() > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 h-5 w-5 p-0 flex items-center justify-center"
              >
                {getActiveFiltersCount()}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader>
            <SheetTitle>Filtrar propiedades</SheetTitle>
            <SheetDescription>
              Utiliza los siguientes filtros para encontrar la propiedad ideal
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 overflow-y-auto h-full pb-20">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Settings2 className="h-5 w-5 mr-2" />
            Filtros
          </span>
          {getActiveFiltersCount() > 0 && (
            <Badge variant="secondary">
              {getActiveFiltersCount()} filtro
              {getActiveFiltersCount() !== 1 ? "s" : ""}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Refina tu búsqueda para encontrar la propiedad ideal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FilterContent />
      </CardContent>
    </Card>
  );
}
