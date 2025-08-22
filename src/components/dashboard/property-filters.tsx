"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  showStatusFilter?: boolean;
}

export function PropertyFilters({
  filters,
  onFiltersChange,
  showStatusFilter = true,
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
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar propiedades..."
            value={filters.search || ""}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="pl-10 h-10 sm:h-9"
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
            <SelectTrigger className="w-full sm:w-48 h-10 sm:h-9">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              className="h-9 sm:h-8 text-xs"
            />
            <Input
              placeholder="Ciudad"
              value={filters.locationCity || ""}
              onChange={(e) =>
                onFiltersChange({ ...filters, locationCity: e.target.value })
              }
              className="h-9 sm:h-8 text-xs"
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
              <SelectTrigger className="h-9 sm:h-8 text-xs">
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
              <SelectTrigger className="h-9 sm:h-8 text-xs">
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
            <NumericInput
              value={filters.minPrice}
              onChange={(value) =>
                onFiltersChange({
                  ...filters,
                  minPrice: value,
                })
              }
              placeholder="Mín"
              min={0}
              aria-label="Precio mínimo"
            />
            <NumericInput
              value={filters.maxPrice}
              onChange={(value) =>
                onFiltersChange({
                  ...filters,
                  maxPrice: value,
                })
              }
              placeholder="Máx"
              min={0}
              aria-label="Precio máximo"
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
            <NumericInput
              value={filters.minBedrooms}
              onChange={(value) =>
                onFiltersChange({
                  ...filters,
                  minBedrooms: value,
                })
              }
              placeholder="Mín"
              min={0}
              step={1}
              aria-label="Dormitorios mínimos"
            />
            <NumericInput
              value={filters.maxBedrooms}
              onChange={(value) =>
                onFiltersChange({
                  ...filters,
                  maxBedrooms: value,
                })
              }
              placeholder="Máx"
              min={0}
              step={1}
              aria-label="Dormitorios máximos"
            />
          </div>
          <div className="flex items-center gap-2">
            <Bath className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Baños</Label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumericInput
              value={filters.minBathrooms}
              onChange={(value) =>
                onFiltersChange({
                  ...filters,
                  minBathrooms: value,
                })
              }
              placeholder="Mín"
              min={0}
              step={0.5}
              aria-label="Baños mínimos"
            />
            <NumericInput
              value={filters.maxBathrooms}
              onChange={(value) =>
                onFiltersChange({
                  ...filters,
                  maxBathrooms: value,
                })
              }
              placeholder="Máx"
              min={0}
              step={0.5}
              aria-label="Baños máximos"
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <NumericInput
            value={filters.minSquareMeters}
            onChange={(value) =>
              onFiltersChange({
                ...filters,
                minSquareMeters: value,
              })
            }
            placeholder="Mínimo"
            min={0}
            step={1}
            suffix="m²"
            aria-label="Área mínima en metros cuadrados"
          />
          <NumericInput
            value={filters.maxSquareMeters}
            onChange={(value) =>
              onFiltersChange({
                ...filters,
                maxSquareMeters: value,
              })
            }
            placeholder="Máximo"
            min={0}
            step={1}
            suffix="m²"
            aria-label="Área máxima en metros cuadrados"
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <span className="hidden sm:inline">Búsqueda:</span>
              <span className="sm:hidden">Bus:</span>
              {filters.search.length > 15
                ? filters.search.substring(0, 15) + "..."
                : filters.search}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  onFiltersChange({ ...filters, search: undefined })
                }
              />
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <span className="hidden sm:inline">Estado:</span>
              <span className="sm:hidden">Est:</span>
              {filters.status}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  onFiltersChange({ ...filters, status: undefined })
                }
              />
            </Badge>
          )}
          {filters.locationState && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <span className="hidden sm:inline">Estado:</span>
              <span className="sm:hidden">Est:</span>
              {filters.locationState}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  onFiltersChange({ ...filters, locationState: undefined })
                }
              />
            </Badge>
          )}
          {filters.locationCity && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <span className="hidden sm:inline">Ciudad:</span>
              <span className="sm:hidden">Ciud:</span>
              {filters.locationCity}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  onFiltersChange({ ...filters, locationCity: undefined })
                }
              />
            </Badge>
          )}
          {(filters.minPrice || filters.maxPrice) && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <span className="hidden sm:inline">Precio:</span>
              <span className="sm:hidden">Prec:</span>
              {filters.minPrice || 0} - {filters.maxPrice || "∞"}
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
            <Badge variant="secondary" className="gap-1 text-xs">
              <span className="hidden sm:inline">Habitaciones:</span>
              <span className="sm:hidden">Hab:</span>
              {filters.minBedrooms || 0} - {filters.maxBedrooms || "∞"}
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
            <Badge variant="secondary" className="gap-1 text-xs">
              <span className="hidden sm:inline">Baños:</span>
              <span className="sm:hidden">Baños:</span>
              {filters.minBathrooms || 0} - {filters.maxBathrooms || "∞"}
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
            <Badge variant="secondary" className="gap-1 text-xs">
              <span className="hidden sm:inline">Área:</span>
              <span className="sm:hidden">Área:</span>
              {filters.minSquareMeters || 0} - {filters.maxSquareMeters || "∞"}{" "}
              m²
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
            <Badge variant="secondary" className="gap-1 text-xs">
              <span className="hidden sm:inline">Tipo:</span>
              <span className="sm:hidden">Tipo:</span>
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
            <Badge variant="secondary" className="gap-1 text-xs">
              <span className="hidden sm:inline">Transacción:</span>
              <span className="sm:hidden">Trans:</span>
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
