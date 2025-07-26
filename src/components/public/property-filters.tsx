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
import { Checkbox } from "@/components/ui/checkbox";
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
  X,
  MapPin,
  Home,
  DollarSign,
  Square,
  Settings2,
} from "lucide-react";

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
  "Jardim",
  "Varanda",
  "Churrasqueira",
  "Academia",
  "Playground",
  "Segurança 24h",
  "Portaria",
  "Elevador",
  "Ar Condicionado",
  "Móveis Planejados",
  "Lareira",
  "Sauna",
  "Salão de Festas",
  "Quadra Esportiva",
];

const STATES = [
  "São Paulo",
  "Rio de Janeiro",
  "Minas Gerais",
  "Bahia",
  "Paraná",
  "Rio Grande do Sul",
  "Pernambuco",
  "Ceará",
  "Pará",
  "Santa Catarina",
];

export function PropertyFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  className = "",
  isMobile = false,
}: PropertyFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const updateFilter = (key: keyof PropertyFilters, value: any) => {
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
        <Label className="text-base font-medium">Tipo de Transação</Label>
        <Select
          value={filters.transactionType || ""}
          onValueChange={(value) => updateFilter("transactionType", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Venda ou Aluguel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="SALE">Venda</SelectItem>
            <SelectItem value="RENT">Aluguel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Property Type */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Tipo de Imóvel</Label>
        <Select
          value={filters.type || ""}
          onValueChange={(value) => updateFilter("type", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="HOUSE">Casa</SelectItem>
            <SelectItem value="APARTMENT">Apartamento</SelectItem>
            <SelectItem value="OFFICE">Escritório</SelectItem>
            <SelectItem value="LAND">Terreno</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Location */}
      <div className="space-y-4">
        <Label className="text-base font-medium flex items-center">
          <MapPin className="h-4 w-4 mr-2" />
          Localização
        </Label>

        <div className="space-y-3">
          <Select
            value={filters.locationState || ""}
            onValueChange={(value) => updateFilter("locationState", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os Estados</SelectItem>
              {STATES.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Cidade"
            value={filters.locationCity || ""}
            onChange={(e) => updateFilter("locationCity", e.target.value)}
          />

          <Input
            placeholder="Bairro"
            value={filters.locationNeigh || ""}
            onChange={(e) => updateFilter("locationNeigh", e.target.value)}
          />
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label className="text-base font-medium flex items-center">
          <DollarSign className="h-4 w-4 mr-2" />
          Faixa de Preço
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Preço mín."
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
            placeholder="Preço máx."
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
            <Label className="text-sm">Quartos</Label>
            <Select
              value={filters.bedrooms?.toString() || ""}
              onValueChange={(value) =>
                updateFilter("bedrooms", value ? parseInt(value) : undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Qualquer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Qualquer</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
                <SelectItem value="5">5+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Banheiros</Label>
            <Select
              value={filters.bathrooms?.toString() || ""}
              onValueChange={(value) =>
                updateFilter("bathrooms", value ? parseInt(value) : undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Qualquer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Qualquer</SelectItem>
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
          <span className="font-medium">Filtros Avançados</span>
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
              Características Especiais
            </Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {FEATURES_OPTIONS.map((feature) => (
                <div key={feature} className="flex items-center space-x-2">
                  <Checkbox
                    id={feature}
                    checked={filters.features?.includes(feature) || false}
                    onCheckedChange={() => toggleFeature(feature)}
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
          Limpar Filtros
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
            <SheetTitle>Filtrar Propriedades</SheetTitle>
            <SheetDescription>
              Use os filtros abaixo para encontrar o imóvel ideal
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
          Refine sua busca para encontrar o imóvel ideal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FilterContent />
      </CardContent>
    </Card>
  );
}
