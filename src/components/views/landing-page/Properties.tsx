"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  MapPin,
  Home,
  Car,
  Bath,
  Bed,
  Users,
  Phone,
  MessageCircle,
  Building2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Grid3X3,
  List,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertyMap } from "@/components/public/property-map";
import { usePropertyLocations } from "@/hooks/use-property-search";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";

interface Property {
  id: string;
  customId?: string;
  title: string;
  description: string;
  type: "HOUSE" | "APARTMENT" | "OFFICE" | "LAND";
  locationState: string;
  locationCity: string;
  locationNeigh: string;
  municipality?: string;
  address?: string;
  googleMapsUrl?: string;
  latitude?: number;
  longitude?: number;
  price: number;
  currency: string;
  exchangeRate?: number;
  bedrooms: number;
  bathrooms: number;
  garageSpaces: number;
  squareMeters: number;
  transactionType: "SALE" | "RENT" | "ANTICRÉTICO";
  status: "PENDING" | "APPROVED" | "REJECTED";
  images: string[];
  videos: string[];
  features: string[];
  agent: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    whatsapp?: string;
  };
  agency: {
    name: string;
    logoUrl?: string;
  };
}

interface SearchFilters {
  searchTerm: string;
  propertyType: string;
  transactionType: string;
  locationState: string;
  locationCity: string;
  municipality: string;
  minPrice: string;
  maxPrice: string;
  minBedrooms: string;
  maxBedrooms: string;
  minBathrooms: string;
  maxBathrooms: string;
}

interface PaginationInfo {
  limit: number;
  offset: number;
  page: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
}

export default function Properties() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [activeTab, setActiveTab] = useState<
    "venta" | "alquiler" | "anticretico" | "proyectos" | "mapa"
  >("mapa");
  const [pagination, setPagination] = useState<PaginationInfo>({
    limit: 9,
    offset: 0,
    page: 1,
    totalPages: 1,
    totalCount: 0,
    hasMore: false,
  });

  // Get dynamic locations
  const { data: locations, isLoading: locationsLoading } =
    usePropertyLocations();

  // Initialize filters from URL params or defaults
  const getInitialFilters = (): SearchFilters => {
    return {
      searchTerm: searchParams.get("search") || "",
      propertyType: searchParams.get("type") || "ALL",
      transactionType: searchParams.get("transactionType") || "ALL",
      locationState: searchParams.get("locationState") || "ALL",
      locationCity: searchParams.get("locationCity") || "ALL",
      municipality: searchParams.get("municipality") || "ALL",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      minBedrooms: searchParams.get("minBedrooms") || "",
      maxBedrooms: searchParams.get("maxBedrooms") || "",
      minBathrooms: searchParams.get("minBathrooms") || "",
      maxBathrooms: searchParams.get("maxBathrooms") || "",
    };
  };

  const [filters, setFilters] = useState<SearchFilters>(getInitialFilters());
  const [debouncedSearch, setDebouncedSearch] = useState<string>(
    getInitialFilters().searchTerm
  );

  // Debounce searchTerm to avoid fetching on every keystroke
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(filters.searchTerm);
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [filters.searchTerm]);

  // Projects state for "proyectos" tab
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
      quadrants?: Array<{ id: string; customId: string }>; // minimal
    }>;
    latitude?: number | null;
    longitude?: number | null;
  }
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);

  // Update URL with current filters
  const updateURL = (newFilters: SearchFilters) => {
    const params = new URLSearchParams();

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== "ALL") {
        params.set(key, value);
      }
    });

    const newURL = params.toString()
      ? `?${params.toString()}`
      : window.location.pathname;
    router.replace(newURL, { scroll: false });
  };

  // Fetch properties from API with search and pagination
  const fetchProperties = async (searchFilters?: SearchFilters, page = 1) => {
    try {
      setSearchLoading(true);
      setError(null);
      const params = new URLSearchParams();

      // Add pagination params
      const limit = 9;
      const offset = (page - 1) * limit;
      params.append("limit", limit.toString());
      params.append("offset", offset.toString());
      params.append("sortBy", "createdAt");
      params.append("sortOrder", "desc");

      // Always restrict to APPROVED for public homepage
      params.append("status", "APPROVED");

      // Add search and filter params
      if (searchFilters) {
        if (searchFilters.searchTerm) {
          params.append("search", searchFilters.searchTerm);
        }
        if (
          searchFilters.propertyType &&
          searchFilters.propertyType !== "ALL"
        ) {
          params.append("type", searchFilters.propertyType);
        }
        // Transaction type comes from active tab for property tabs
        const tabToTransaction: Record<string, string> = {
          venta: "SALE",
          alquiler: "RENT",
          anticretico: "ANTICRÉTICO",
        };
        if (activeTab !== "proyectos") {
          const tx = tabToTransaction[activeTab];
          if (tx) params.append("transactionType", tx);
        } else if (
          searchFilters.transactionType &&
          searchFilters.transactionType !== "ALL"
        ) {
          // Fallback (shouldn't happen on proyectos tab)
          params.append("transactionType", searchFilters.transactionType);
        }
        if (
          searchFilters.locationState &&
          searchFilters.locationState !== "ALL"
        ) {
          params.append("locationState", searchFilters.locationState);
        }
        if (
          searchFilters.locationCity &&
          searchFilters.locationCity !== "ALL"
        ) {
          params.append("locationCity", searchFilters.locationCity);
        }
        if (
          searchFilters.municipality &&
          searchFilters.municipality !== "ALL"
        ) {
          params.append("municipality", searchFilters.municipality);
        }
        if (searchFilters.minPrice) {
          params.append("minPrice", searchFilters.minPrice);
        }
        if (searchFilters.maxPrice) {
          params.append("maxPrice", searchFilters.maxPrice);
        }
        if (searchFilters.minBedrooms) {
          params.append("minBedrooms", searchFilters.minBedrooms);
        }
        if (searchFilters.maxBedrooms) {
          params.append("maxBedrooms", searchFilters.maxBedrooms);
        }
        if (searchFilters.minBathrooms) {
          params.append("minBathrooms", searchFilters.minBathrooms);
        }
        if (searchFilters.maxBathrooms) {
          params.append("maxBathrooms", searchFilters.maxBathrooms);
        }
      }

      const response = await fetch(`/api/properties?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response:", data);
      console.log("Properties from API:", data.properties);
      console.log(
        "Properties with coordinates:",
        data.properties?.filter((p: Property) => p.latitude && p.longitude)
      );
      setProperties(data.properties || []);
      setPagination({
        limit: data.pagination.limit,
        offset: data.pagination.offset,
        page: data.pagination.page,
        totalPages: data.pagination.totalPages,
        totalCount: data.total,
        hasMore: data.hasMore,
      });
    } catch (error) {
      console.error("Error fetching properties:", error);
      setError("Error al cargar las propiedades. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);
      setProjectsError(null);
      const params = new URLSearchParams();
      if (filters.searchTerm) params.append("search", filters.searchTerm);
      const res = await fetch(`/api/public/projects?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (e) {
      console.error("Error fetching projects:", e);
      setProjectsError(
        "Error al cargar los proyectos. Por favor, intenta de nuevo."
      );
    } finally {
      setProjectsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    // While typing, wait for debounce to settle
    if (filters.searchTerm !== debouncedSearch) return;

    const effectiveFilters = { ...filters, searchTerm: debouncedSearch };

    if (activeTab === "proyectos") {
      fetchProjects();
    } else if (activeTab === "mapa") {
      // Load both datasets for the map
      fetchProperties(effectiveFilters);
      fetchProjects();
    } else {
      fetchProperties(effectiveFilters);
    }
  }, [filters, activeTab, debouncedSearch]);

  // Sync initial tab based on URL hash "#properties?tab=<value>" or query param "tab"
  useEffect(() => {
    const tabParam = (searchParams.get("tab") || "").toLowerCase();
    if (
      tabParam === "venta" ||
      tabParam === "alquiler" ||
      tabParam === "anticretico" ||
      tabParam === "proyectos" ||
      tabParam === "mapa"
    ) {
      setActiveTab(tabParam as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to URL query changes triggered from the hero search (search/type/tab)
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    const urlType = searchParams.get("type") || "ALL";
    const urlTab = (searchParams.get("tab") || "").toLowerCase();

    setFilters((prev) => ({
      ...prev,
      searchTerm: urlSearch,
      propertyType: urlType || "ALL",
    }));

    if (
      urlTab === "venta" ||
      urlTab === "alquiler" ||
      urlTab === "anticretico" ||
      urlTab === "proyectos" ||
      urlTab === "mapa"
    ) {
      setActiveTab(urlTab as any);
    }
  }, [searchParams]);

  // Handle search button click
  const handleSearch = () => {
    // Apply immediately, bypassing debounce
    updateURL(filters);
    setDebouncedSearch(filters.searchTerm);
    fetchProperties(filters, 1);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    fetchProperties(filters, newPage);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      searchTerm: "",
      propertyType: "ALL",
      transactionType: "ALL",
      locationState: "ALL",
      locationCity: "ALL",
      municipality: "ALL",
      minPrice: "",
      maxPrice: "",
      minBedrooms: "",
      maxBedrooms: "",
      minBathrooms: "",
      maxBathrooms: "",
    };
    setFilters(clearedFilters);
    updateURL(clearedFilters);
    fetchProperties(clearedFilters, 1);
  };

  const handlePropertyClick = (propertyId: string) => {
    router.push(`/property/${propertyId}`);
  };

  const formatPrice = (price: number, currency: string = "USD") => {
    const currencySymbol = currency === "DOLLARS" ? "$" : "Bs.";
    return `${currencySymbol} ${price.toLocaleString()}`;
  };

  const getPropertyTypeIcon = (type: string) => {
    switch (type) {
      case "HOUSE":
        return <Home className="h-4 w-4" />;
      case "APARTMENT":
        return <Building2 className="h-4 w-4" />;
      case "OFFICE":
        return <Building2 className="h-4 w-4" />;
      case "LAND":
        return <MapPin className="h-4 w-4" />;
      default:
        return <Home className="h-4 w-4" />;
    }
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

  type FiltersSheetProps = {
    filters: SearchFilters;
    onChange: (key: keyof SearchFilters, value: string) => void;
    onApply: () => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    locations: any;
    locationsLoading: boolean;
  };

  const FiltersSheet = ({
    filters,
    onChange,
    onApply,
    open,
    onOpenChange,
    locations,
    locationsLoading,
  }: FiltersSheetProps) => {
    return (
      <div hidden={!open} className="fixed inset-0 z-50">
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => onOpenChange(false)}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl p-4 shadow-2xl">
          <div className="mx-auto max-w-md">
            <div className="h-1 w-10 bg-muted mx-auto rounded-full mb-4" />
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <Select
                  value={filters.locationState}
                  onValueChange={(value) => onChange("locationState", value)}
                  disabled={locationsLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={locationsLoading ? "Cargando..." : "Estado"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los estados</SelectItem>
                    {locations?.states?.map((state: string) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.locationCity}
                  onValueChange={(value) => onChange("locationCity", value)}
                  disabled={locationsLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={locationsLoading ? "Cargando..." : "Ciudad"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas las ciudades</SelectItem>
                    {locations?.cities?.map(
                      (city: { value: string; label: string }) => (
                        <SelectItem key={city.value} value={city.value}>
                          {city.label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.municipality}
                  onValueChange={(value) => onChange("municipality", value)}
                  disabled={locationsLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        locationsLoading ? "Cargando..." : "Municipio"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los municipios</SelectItem>
                    {locations?.municipalities?.map((municipality: string) => (
                      <SelectItem key={municipality} value={municipality}>
                        {municipality}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Precio mín."
                    inputMode="numeric"
                    value={filters.minPrice}
                    onChange={(e) => onChange("minPrice", e.target.value)}
                  />
                  <Input
                    placeholder="Precio máx."
                    inputMode="numeric"
                    value={filters.maxPrice}
                    onChange={(e) => onChange("maxPrice", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Mín. hab."
                    inputMode="numeric"
                    value={filters.minBedrooms}
                    onChange={(e) => onChange("minBedrooms", e.target.value)}
                  />
                  <Input
                    placeholder="Máx. hab."
                    inputMode="numeric"
                    value={filters.maxBedrooms}
                    onChange={(e) => onChange("maxBedrooms", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Mín. baños"
                    inputMode="numeric"
                    value={filters.minBathrooms}
                    onChange={(e) => onChange("minBathrooms", e.target.value)}
                  />
                  <Input
                    placeholder="Máx. baños"
                    inputMode="numeric"
                    value={filters.maxBathrooms}
                    onChange={(e) => onChange("maxBathrooms", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={onApply}>
                  Aplicar filtros
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    onChange("minPrice", "");
                    onChange("maxPrice", "");
                    onChange("minBedrooms", "");
                    onChange("maxBedrooms", "");
                    onChange("minBathrooms", "");
                    onChange("maxBathrooms", "");
                  }}
                >
                  Limpiar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
        return type;
    }
  };

  const handleContactAgent = (phone?: string, whatsapp?: string) => {
    if (whatsapp) {
      window.open(`https://wa.me/${whatsapp}`, "_blank");
    } else if (phone) {
      window.open(`tel:${phone}`, "_blank");
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando propiedades...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50" id="properties">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {activeTab === "proyectos"
              ? "Explora Proyectos"
              : "Encuentra tu Propiedad Ideal"}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {activeTab === "proyectos"
              ? "Descubre proyectos activos y sus unidades disponibles."
              : "Explora nuestra selección de propiedades en venta, alquiler y anticrético."}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-6">
          <Tabs
            value={activeTab}
            onValueChange={(v: string) =>
              setActiveTab(
                v as "venta" | "alquiler" | "anticretico" | "proyectos" | "mapa"
              )
            }
          >
            <TabsList className="max-w-full overflow-x-auto whitespace-nowrap">
              <TabsTrigger value="mapa">Todos</TabsTrigger>
              <TabsTrigger value="venta">Venta</TabsTrigger>
              <TabsTrigger value="alquiler">Alquiler</TabsTrigger>
              <TabsTrigger value="anticretico">Anticrético</TabsTrigger>
              <TabsTrigger value="proyectos">Proyectos</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search Filters - only for properties tabs */}
        {activeTab !== "proyectos" && (
          <>
            {/* Compact top bar on mobile */}
            <div className="sm:hidden mb-4 flex flex-col gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por título, descripción o ubicación..."
                  value={filters.searchTerm}
                  onChange={(e) =>
                    handleFilterChange("searchTerm", e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Select
                  value={filters.propertyType}
                  onValueChange={(value) =>
                    handleFilterChange("propertyType", value)
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="HOUSE">Casa</SelectItem>
                    <SelectItem value="APARTMENT">Departamento</SelectItem>
                    <SelectItem value="OFFICE">Oficina</SelectItem>
                    <SelectItem value="LAND">Terreno</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="sm:hidden"
                  onClick={() => setShowFiltersSheet(true)}
                >
                  <Search className="h-4 w-4 mr-1" /> Filtros
                </Button>
                <Button
                  className="hidden sm:inline-flex"
                  onClick={handleSearch}
                  disabled={searchLoading}
                >
                  {searchLoading ? "Buscando..." : "Buscar"}
                </Button>
              </div>
            </div>

            {/* Active filter chips */}
            <div className="mb-4 flex flex-wrap gap-2 text-sm">
              {filters.propertyType !== "ALL" && (
                <Badge
                  variant="secondary"
                  onClick={() => handleFilterChange("propertyType", "ALL")}
                  className="cursor-pointer"
                >
                  Tipo: {getPropertyTypeLabel(filters.propertyType)} ✕
                </Badge>
              )}
              {filters.locationState !== "ALL" && (
                <Badge
                  variant="secondary"
                  onClick={() => handleFilterChange("locationState", "ALL")}
                  className="cursor-pointer"
                >
                  Estado: {filters.locationState} ✕
                </Badge>
              )}
              {filters.locationCity !== "ALL" && (
                <Badge
                  variant="secondary"
                  onClick={() => handleFilterChange("locationCity", "ALL")}
                  className="cursor-pointer"
                >
                  Ciudad: {filters.locationCity} ✕
                </Badge>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <Badge
                  variant="secondary"
                  onClick={() => {
                    handleFilterChange("minPrice", "");
                    handleFilterChange("maxPrice", "");
                  }}
                  className="cursor-pointer"
                >
                  Precio: {filters.minPrice || 0} - {filters.maxPrice || "∞"} ✕
                </Badge>
              )}
              {(filters.minBedrooms || filters.maxBedrooms) && (
                <Badge
                  variant="secondary"
                  onClick={() => {
                    handleFilterChange("minBedrooms", "");
                    handleFilterChange("maxBedrooms", "");
                  }}
                  className="cursor-pointer"
                >
                  Habitaciones: {filters.minBedrooms || 0} -{" "}
                  {filters.maxBedrooms || "∞"} ✕
                </Badge>
              )}
              {(filters.minBathrooms || filters.maxBathrooms) && (
                <Badge
                  variant="secondary"
                  onClick={() => {
                    handleFilterChange("minBathrooms", "");
                    handleFilterChange("maxBathrooms", "");
                  }}
                  className="cursor-pointer"
                >
                  Baños: {filters.minBathrooms || 0} -{" "}
                  {filters.maxBathrooms || "∞"} ✕
                </Badge>
              )}
              {/* Clear all (mobile only) */}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="sm:hidden"
              >
                Limpiar todo
              </Button>
            </div>

            {/* Advanced filters bottom sheet (mobile) or inline (desktop) */}
            <div className="sm:hidden">
              <FiltersSheet
                filters={filters}
                onChange={handleFilterChange}
                onApply={() => handleSearch()}
                locations={locations}
                locationsLoading={locationsLoading}
                open={showFiltersSheet}
                onOpenChange={setShowFiltersSheet}
              />
            </div>
            <div className="hidden sm:block">
              {/* Full filter card on desktop */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Buscar Propiedades
                  </CardTitle>
                  <CardDescription>
                    Utiliza los filtros para encontrar la propiedad que mejor se
                    adapte a tus necesidades
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search Term */}
                    <div className="lg:col-span-2">
                      <Input
                        placeholder="Buscar por título, descripción o ubicación..."
                        value={filters.searchTerm}
                        onChange={(e) =>
                          handleFilterChange("searchTerm", e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSearch();
                        }}
                      />
                    </div>

                    {/* Property Type */}
                    <Select
                      value={filters.propertyType}
                      onValueChange={(value) =>
                        handleFilterChange("propertyType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de propiedad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todos los tipos</SelectItem>
                        <SelectItem value="HOUSE">Casa</SelectItem>
                        <SelectItem value="APARTMENT">Apartamento</SelectItem>
                        <SelectItem value="OFFICE">Oficina</SelectItem>
                        <SelectItem value="LAND">Terreno</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Location State */}
                    <Select
                      value={filters.locationState}
                      onValueChange={(value) =>
                        handleFilterChange("locationState", value)
                      }
                      disabled={locationsLoading}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            locationsLoading ? "Cargando..." : "Estado"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todos los estados</SelectItem>
                        {locations?.states?.map((state: string) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Location City */}
                    <Select
                      value={filters.locationCity}
                      onValueChange={(value) =>
                        handleFilterChange("locationCity", value)
                      }
                      disabled={locationsLoading}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            locationsLoading ? "Cargando..." : "Ciudad"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todas las ciudades</SelectItem>
                        {locations?.cities?.map(
                          (city: { value: string; label: string }) => (
                            <SelectItem key={city.value} value={city.value}>
                              {city.label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>

                    {/* Municipality */}
                    <Select
                      value={filters.municipality}
                      onValueChange={(value) =>
                        handleFilterChange("municipality", value)
                      }
                      disabled={locationsLoading}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            locationsLoading ? "Cargando..." : "Municipio"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">
                          Todos los municipios
                        </SelectItem>
                        {locations?.municipalities?.map(
                          (municipality: string) => (
                            <SelectItem key={municipality} value={municipality}>
                              {municipality}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>

                    {/* Price Range */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Precio mínimo"
                        type="number"
                        value={filters.minPrice}
                        onChange={(e) =>
                          handleFilterChange("minPrice", e.target.value)
                        }
                      />
                      <Input
                        placeholder="Precio máximo"
                        type="number"
                        value={filters.maxPrice}
                        onChange={(e) =>
                          handleFilterChange("maxPrice", e.target.value)
                        }
                      />
                    </div>

                    {/* Bedrooms */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Mín. habitaciones"
                        type="number"
                        value={filters.minBedrooms}
                        onChange={(e) =>
                          handleFilterChange("minBedrooms", e.target.value)
                        }
                      />
                      <Input
                        placeholder="Máx. habitaciones"
                        type="number"
                        value={filters.maxBedrooms}
                        onChange={(e) =>
                          handleFilterChange("maxBedrooms", e.target.value)
                        }
                      />
                    </div>

                    {/* Bathrooms */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Mín. baños"
                        type="number"
                        value={filters.minBathrooms}
                        onChange={(e) =>
                          handleFilterChange("minBathrooms", e.target.value)
                        }
                      />
                      <Input
                        placeholder="Máx. baños"
                        type="number"
                        value={filters.maxBathrooms}
                        onChange={(e) =>
                          handleFilterChange("maxBathrooms", e.target.value)
                        }
                      />
                    </div>

                    {/* Search and Clear Buttons */}
                    <div className="lg:col-span-4 flex justify-center gap-4">
                      <Button
                        onClick={handleSearch}
                        disabled={searchLoading}
                        className="flex items-center gap-2"
                      >
                        {searchLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                        {searchLoading ? "Buscando..." : "Buscar Propiedades"}
                      </Button>
                      <Button variant="outline" onClick={clearFilters}>
                        Limpiar Filtros
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Property Map: keep mounted to avoid Leaflet re-init issues */}
        <div className="mb-8">
          <PropertyMap
            properties={
              activeTab === "proyectos"
                ? []
                : properties.filter((p) => p.latitude && p.longitude)
            }
            projects={
              activeTab === "proyectos" || activeTab === "mapa"
                ? projects
                    .filter((p) => p.latitude && p.longitude)
                    .map((p) => ({
                      id: p.id,
                      name: p.name,
                      location: p.location,
                      latitude: (p.latitude ?? undefined) as number | undefined,
                      longitude: (p.longitude ?? undefined) as
                        | number
                        | undefined,
                    }))
                : []
            }
            className="w-full"
          />
        </div>

        {/* Results Count and View Toggle */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-gray-600">
            {activeTab === "proyectos"
              ? `${projects.length} proyecto${projects.length !== 1 ? "s" : ""} encontrado${projects.length !== 1 ? "s" : ""}`
              : activeTab === "mapa"
                ? `${pagination.totalCount} propiedades y ${projects.length} proyectos`
                : `${pagination.totalCount} propiedad${pagination.totalCount !== 1 ? "es" : ""} encontrada${pagination.totalCount !== 1 ? "s" : ""}`}
            {activeTab !== "proyectos" &&
              activeTab !== "mapa" &&
              pagination.totalPages > 1 && (
                <span className="ml-2">
                  (Página {pagination.page} de {pagination.totalPages})
                </span>
              )}
          </p>

          {/* View Toggle */}
          {activeTab !== "proyectos" && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Vista:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "cards" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                  className="flex items-center gap-1"
                >
                  <Grid3X3 className="h-4 w-4" />
                  Tarjetas
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="flex items-center gap-1"
                >
                  <List className="h-4 w-4" />
                  Lista
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Properties Display */}
        {activeTab !== "proyectos" ? (
          properties.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No se encontraron propiedades
              </h3>
              <p className="text-gray-600">
                Intenta ajustar los filtros de búsqueda
              </p>
            </div>
          ) : (
            <>
              {viewMode === "cards" ? (
                /* Card View */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <Card
                      key={property.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handlePropertyClick(property.id)}
                    >
                      {/* Property Image */}
                      <div className="relative h-48 bg-gray-200">
                        {property.images && property.images.length > 0 ? (
                          <Image
                            src={property.images[0]}
                            alt={property.title}
                            width={400}
                            height={192}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <Home className="h-12 w-12 text-gray-400" />
                          </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex gap-2">
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {getPropertyTypeIcon(property.type)}
                            {getPropertyTypeLabel(property.type)}
                          </Badge>
                          <Badge
                            variant={
                              property.transactionType === "SALE"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {getTransactionTypeLabel(property.transactionType)}
                          </Badge>
                        </div>
                      </div>

                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg line-clamp-2">
                          {property.title}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {property.locationCity}, {property.locationState}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="pt-0">
                        {/* Price */}
                        <div className="mb-4">
                          <p className="text-2xl font-bold text-primary">
                            {formatPrice(property.price, property.currency)}
                          </p>
                        </div>

                        {/* Property Details */}
                        <div className="grid grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Bed className="h-4 w-4" />
                            <span>{property.bedrooms} hab.</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Bath className="h-4 w-4" />
                            <span>{property.bathrooms} baños</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Car className="h-4 w-4" />
                            <span>{property.garageSpaces} gar.</span>
                          </div>
                        </div>

                        {/* Square Meters */}
                        <div className="mb-4 text-sm text-gray-600">
                          <span>{property.squareMeters} m²</span>
                        </div>

                        {/* Features */}
                        {property.features && property.features.length > 0 && (
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-1">
                              {property.features
                                .slice(0, 3)
                                .map((feature, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {feature}
                                  </Badge>
                                ))}
                              {property.features.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{property.features.length - 3} más
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        <Separator className="my-4" />

                        {/* Agent Info */}
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium">
                              {property.agent.firstName}{" "}
                              {property.agent.lastName}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {property.agency.name}
                          </p>
                        </div>

                        {/* Contact Buttons */}
                        <div className="flex gap-2">
                          {property.agent.phone && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContactAgent(property.agent.phone);
                              }}
                            >
                              <Phone className="h-4 w-4 mr-1" />
                              Llamar
                            </Button>
                          )}
                          {property.agent.whatsapp && (
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContactAgent(
                                  undefined,
                                  property.agent.whatsapp
                                );
                              }}
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              WhatsApp
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                /* List View */
                <div className="space-y-3">
                  {properties.map((property) => (
                    <Card
                      key={property.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handlePropertyClick(property.id)}
                    >
                      <div className="flex flex-row items-stretch gap-3 min-h-[6rem] sm:min-h-[8rem]">
                        {/* Property Image */}
                        <div className="relative w-28 sm:w-40 lg:w-64 self-stretch bg-gray-200 flex-shrink-0 overflow-hidden rounded-md">
                          {property.images && property.images.length > 0 ? (
                            <Image
                              src={property.images[0]}
                              alt={property.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <Home className="h-12 w-12 text-gray-400" />
                            </div>
                          )}

                          {/* Badges */}
                          <div className="absolute top-1 left-1 right-1 flex flex-wrap gap-1">
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1 text-[10px] h-5 px-1.5"
                            >
                              {getPropertyTypeIcon(property.type)}
                              {getPropertyTypeLabel(property.type)}
                            </Badge>
                            <Badge
                              variant={
                                property.transactionType === "SALE"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-[10px] h-5 px-1.5"
                            >
                              {getTransactionTypeLabel(
                                property.transactionType
                              )}
                            </Badge>
                          </div>
                        </div>

                        {/* Property Content */}
                        <div className="flex-1 p-4 sm:p-5 lg:p-6">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4">
                            {/* Left Column - Property Info */}
                            <div className="flex-1">
                              <div className="mb-2 sm:mb-3">
                                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-1 sm:mb-2 line-clamp-1">
                                  {property.title}
                                </h3>
                                <p className="text-gray-600 flex items-center gap-1 mb-1 sm:mb-2 text-sm">
                                  <MapPin className="h-4 w-4" />
                                  {property.locationCity},{" "}
                                  {property.locationState}
                                </p>
                                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">
                                  {formatPrice(
                                    property.price,
                                    property.currency
                                  )}
                                </p>
                              </div>

                              {/* Property Details */}
                              <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Bed className="h-4 w-4" />
                                  <span>{property.bedrooms} habitaciones</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Bath className="h-4 w-4" />
                                  <span>{property.bathrooms} baños</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Car className="h-4 w-4" />
                                  <span>{property.garageSpaces} garajes</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">
                                    {property.squareMeters} m²
                                  </span>
                                </div>
                              </div>
                              {/* Condensed details for mobile */}
                              <div className="flex sm:hidden items-center gap-3 mb-2 text-xs text-gray-600">
                                <span className="inline-flex items-center gap-1">
                                  <Bed className="h-3.5 w-3.5" />{" "}
                                  {property.bedrooms}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Bath className="h-3.5 w-3.5" />{" "}
                                  {property.bathrooms}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Car className="h-3.5 w-3.5" />{" "}
                                  {property.garageSpaces}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  {property.squareMeters} m²
                                </span>
                              </div>

                              {/* Features */}
                              {property.features &&
                                property.features.length > 0 && (
                                  <div className="hidden sm:block mb-3">
                                    <div className="flex flex-wrap gap-1">
                                      {property.features
                                        .slice(0, 5)
                                        .map((feature, index) => (
                                          <Badge
                                            key={index}
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {feature}
                                          </Badge>
                                        ))}
                                      {property.features.length > 5 && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          +{property.features.length - 5} más
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>

                            {/* Right Column - Agent Info and Actions */}
                            <div className="lg:w-48">
                              <div className="hidden sm:block mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Users className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm font-medium">
                                    {property.agent.firstName}{" "}
                                    {property.agent.lastName}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mb-4">
                                  {property.agency.name}
                                </p>
                              </div>

                              {/* Contact Buttons */}
                              <div className="hidden sm:flex flex-col gap-2">
                                {property.agent.phone && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleContactAgent(property.agent.phone);
                                    }}
                                  >
                                    <Phone className="h-4 w-4 mr-1" />
                                    Llamar
                                  </Button>
                                )}
                                {property.agent.whatsapp && (
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleContactAgent(
                                        undefined,
                                        property.agent.whatsapp
                                      );
                                    }}
                                  >
                                    <MessageCircle className="h-4 w-4 mr-1" />
                                    WhatsApp
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Mobile contact row */}
                          <div className="flex sm:hidden gap-2 mt-2">
                            {property.agent.phone && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleContactAgent(property.agent.phone);
                                }}
                              >
                                <Phone className="h-4 w-4 mr-1" /> Llamar
                              </Button>
                            )}
                            {property.agent.whatsapp && (
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleContactAgent(
                                    undefined,
                                    property.agent.whatsapp
                                  );
                                }}
                              >
                                <MessageCircle className="h-4 w-4 mr-1" />{" "}
                                WhatsApp
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (
                          pagination.page >=
                          pagination.totalPages - 2
                        ) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={
                              pagination.page === pageNum
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-10 h-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )
        ) : (
          // Proyectos tab content
          <>
            {projectsLoading ? (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="h-48 bg-gray-200 animate-pulse" />
                    <div className="p-4 space-y-3">
                      <div className="h-6 w-32 bg-gray-200 animate-pulse" />
                      <div className="h-4 w-full bg-gray-200 animate-pulse" />
                      <div className="h-4 w-3/4 bg-gray-200 animate-pulse" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : projectsError ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Error al cargar proyectos
                </h3>
                <p className="text-gray-600">{projectsError}</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No se encontraron proyectos
                </h3>
                <p className="text-gray-600">Intenta ajustar tu búsqueda</p>
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <Card key={project.id} className="overflow-hidden">
                    <div className="relative h-48 bg-gray-100">
                      {project.images && project.images.length > 0 ? (
                        <Image
                          src={project.images[0]}
                          alt={project.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <Building2 className="h-10 w-10 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg line-clamp-1">
                          {project.name}
                        </h3>
                        <Badge variant="secondary">
                          {project.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {project.description}
                      </p>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin className="mr-1 h-4 w-4" />
                        {project.location}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Pisos:</span>
                        <span className="font-medium">
                          {project.floors?.length || 0}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
