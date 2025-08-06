"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  X,
  MapPin,
  Home,
  Car,
  Bath,
  Bed,
  DollarSign,
} from "lucide-react";
import { PropertyStatus } from "@prisma/client";

export interface PropertyFilters {
  search?: string;
  status?: PropertyStatus;
  locationState?: string;
  locationCity?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minSquareMeters?: number;
  maxSquareMeters?: number;
  propertyType?: string;
  transactionType?: string;
}

interface PropertyFiltersProps {
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
  onReset?: () => void;
  showStatusFilter?: boolean;
  showAgentFilter?: boolean;
}

export function PropertyFilters({
  filters,
  onFiltersChange,
  onReset,
  showStatusFilter = true,
  showAgentFilter = false,
}: PropertyFiltersProps) {
  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(
      (value) => value !== undefined && value !== "" && value !== null
    ).length;
  };

  // Use the correct enum values from Prisma schema
  const propertyTypes = [
    { value: "HOUSE", label: "Casa" },
    { value: "APARTMENT", label: "Apartamento" },
    { value: "OFFICE", label: "Oficina" },
    { value: "LAND", label: "Terreno" },
  ];

  const transactionTypes = [
    { value: "SALE", label: "Venta" },
    { value: "RENT", label: "Alquiler" },
    { value: "ANTICRÉTICO", label: "Anticrético" },
  ];

  const statusOptions = [
    { value: "all", label: "Todos los Estados" },
    { value: "PENDING", label: "Pendiente" },
    { value: "APPROVED", label: "Aprobado" },
    { value: "REJECTED", label: "Rechazado" },
  ];

  return (
    <div className="space-y-4">
      {/* Main Search and Status Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar propiedades..."
            value={filters.search || ""}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="pl-10"
          />
        </div>

        {showStatusFilter && (
          <Select
            value={filters.status || "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                status: value === "all" ? undefined : (value as PropertyStatus),
              })
            }
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Horizontal Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Location Filters */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Ubicación</Label>
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Estado"
              value={filters.locationState || ""}
              onChange={(e) =>
                onFiltersChange({ ...filters, locationState: e.target.value })
              }
              className="h-8 text-xs"
            />
            <Input
              placeholder="Ciudad"
              value={filters.locationCity || ""}
              onChange={(e) =>
                onFiltersChange({ ...filters, locationCity: e.target.value })
              }
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* Property Type and Transaction */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Tipo</Label>
          </div>
          <div className="space-y-2">
            <Select
              value={filters.propertyType || "none"}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  propertyType: value === "none" ? undefined : value,
                })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tipo de propiedad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Todos los tipos</SelectItem>
                {propertyTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.transactionType || "none"}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  transactionType: value === "none" ? undefined : value,
                })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tipo de transacción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Todos los tipos</SelectItem>
                {transactionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Price Range */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Precio</Label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Mín"
              value={filters.minPrice || ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  minPrice: e.target.value
                    ? parseFloat(e.target.value)
                    : undefined,
                })
              }
              className="h-8 text-xs"
            />
            <Input
              type="number"
              placeholder="Máx"
              value={filters.maxPrice || ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  maxPrice: e.target.value
                    ? parseFloat(e.target.value)
                    : undefined,
                })
              }
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* Bedrooms and Bathrooms */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Bed className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Habitaciones</Label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Mín"
              value={filters.minBedrooms || ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  minBedrooms: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              className="h-8 text-xs"
            />
            <Input
              type="number"
              placeholder="Máx"
              value={filters.maxBedrooms || ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  maxBedrooms: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              className="h-8 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <Bath className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Baños</Label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Mín"
              value={filters.minBathrooms || ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  minBathrooms: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              className="h-8 text-xs"
            />
            <Input
              type="number"
              placeholder="Máx"
              value={filters.maxBathrooms || ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  maxBathrooms: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Area Filter - Full Width */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Área (m²)</Label>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Input
            type="number"
            placeholder="Mínimo"
            value={filters.minSquareMeters || ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                minSquareMeters: e.target.value
                  ? parseFloat(e.target.value)
                  : undefined,
              })
            }
            className="h-8 text-xs"
          />
          <Input
            type="number"
            placeholder="Máximo"
            value={filters.maxSquareMeters || ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                maxSquareMeters: e.target.value
                  ? parseFloat(e.target.value)
                  : undefined,
              })
            }
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Búsqueda: {filters.search}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  onFiltersChange({ ...filters, search: undefined })
                }
              />
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              Estado: {filters.status}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  onFiltersChange({ ...filters, status: undefined })
                }
              />
            </Badge>
          )}
          {filters.locationState && (
            <Badge variant="secondary" className="gap-1">
              Estado: {filters.locationState}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  onFiltersChange({ ...filters, locationState: undefined })
                }
              />
            </Badge>
          )}
          {filters.locationCity && (
            <Badge variant="secondary" className="gap-1">
              Ciudad: {filters.locationCity}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  onFiltersChange({ ...filters, locationCity: undefined })
                }
              />
            </Badge>
          )}
          {(filters.minPrice || filters.maxPrice) && (
            <Badge variant="secondary" className="gap-1">
              Precio: {filters.minPrice || 0} - {filters.maxPrice || "∞"}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    minPrice: undefined,
                    maxPrice: undefined,
                  })
                }
              />
            </Badge>
          )}
          {(filters.minBedrooms || filters.maxBedrooms) && (
            <Badge variant="secondary" className="gap-1">
              Habitaciones: {filters.minBedrooms || 0} -{" "}
              {filters.maxBedrooms || "∞"}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    minBedrooms: undefined,
                    maxBedrooms: undefined,
                  })
                }
              />
            </Badge>
          )}
          {(filters.minBathrooms || filters.maxBathrooms) && (
            <Badge variant="secondary" className="gap-1">
              Baños: {filters.minBathrooms || 0} - {filters.maxBathrooms || "∞"}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    minBathrooms: undefined,
                    maxBathrooms: undefined,
                  })
                }
              />
            </Badge>
          )}
          {(filters.minSquareMeters || filters.maxSquareMeters) && (
            <Badge variant="secondary" className="gap-1">
              Área: {filters.minSquareMeters || 0} -{" "}
              {filters.maxSquareMeters || "∞"} m²
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    minSquareMeters: undefined,
                    maxSquareMeters: undefined,
                  })
                }
              />
            </Badge>
          )}
          {filters.propertyType && (
            <Badge variant="secondary" className="gap-1">
              Tipo:{" "}
              {propertyTypes.find((t) => t.value === filters.propertyType)
                ?.label || filters.propertyType}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  onFiltersChange({ ...filters, propertyType: undefined })
                }
              />
            </Badge>
          )}
          {filters.transactionType && (
            <Badge variant="secondary" className="gap-1">
              Transacción:{" "}
              {transactionTypes.find((t) => t.value === filters.transactionType)
                ?.label || filters.transactionType}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  onFiltersChange({ ...filters, transactionType: undefined })
                }
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
