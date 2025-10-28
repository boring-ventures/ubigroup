"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isValidCoordinates } from "@/lib/utils";
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
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [activeTab, setActiveTab] = useState<
    "venta" | "alquiler" | "anticretico" | "proyectos" | "mapa"
  >("mapa");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    limit: 6,
    offset: 0,
    page: 1,
    totalPages: 1,
    totalCount: 0,
    hasMore: false,
  });

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
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set()
  );

  // Fetch properties from API with search and pagination
  const fetchProperties = useCallback(
    async (searchFilters?: SearchFilters) => {
      try {
        setError(null);
        setCurrentPage(1); // Reset to page 1 when fetching new data
        const params = new URLSearchParams();

        // Add pagination params
        // Always fetch enough properties to show all on the map (100)
        // This ensures the map shows all filtered properties, not just the current page
        const limit = 100;
        const offset = 0;
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
          if (activeTab !== "proyectos" && activeTab !== "mapa") {
            // Only filter by transaction type for specific property tabs, not for "mapa" (Todos)
            const tx = tabToTransaction[activeTab];
            if (tx) params.append("transactionType", tx);
          } else if (
            searchFilters.transactionType &&
            searchFilters.transactionType !== "ALL"
          ) {
            // Fallback for proyectos tab or when filters specify a transaction type
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

        const response = await fetch(
          `/api/public/properties?${params.toString()}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("API Response:", data);
        console.log("Properties from API:", data.properties);

        // Log invalid coordinates for debugging
        const invalidCoordinates = data.properties?.filter(
          (p: Property) =>
            p.latitude !== null &&
            p.latitude !== undefined &&
            p.longitude !== null &&
            p.longitude !== undefined &&
            !isValidCoordinates(p.latitude, p.longitude)
        );
        if (invalidCoordinates && invalidCoordinates.length > 0) {
          console.log(
            "Properties with invalid coordinates (filtered out):",
            invalidCoordinates.map((p: Property) => ({
              id: p.id,
              title: p.title,
              latitude: p.latitude,
              longitude: p.longitude,
            }))
          );
        }

        console.log(
          "Properties with valid coordinates:",
          data.properties?.filter((p: Property) =>
            isValidCoordinates(p.latitude, p.longitude)
          )
        );
        setProperties(data.properties || []);

        // Calculate client-side pagination for card display (6 per page)
        const totalCount = data.properties?.length || 0;
        const cardsPerPage = 6;
        const totalPages = Math.ceil(totalCount / cardsPerPage);

        setPagination({
          limit: cardsPerPage,
          offset: 0,
          page: 1,
          totalPages: totalPages,
          totalCount: totalCount,
          hasMore: totalPages > 1,
        });
      } catch (error) {
        console.error("Error fetching properties:", error);
        setError(
          "Error al cargar las propiedades. Por favor, intenta de nuevo."
        );
      } finally {
        setLoading(false);
      }
    },
    [activeTab]
  );

  const fetchProjects = useCallback(async () => {
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
  }, [filters.searchTerm]);

  // Initial load
  useEffect(() => {
    // While typing, wait for debounce to settle
    if (filters.searchTerm !== debouncedSearch) return;

    // Reset to page 1 when tab or filters change
    setCurrentPage(1);

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
  }, [filters, activeTab, debouncedSearch, fetchProperties, fetchProjects]);

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
      setActiveTab(
        tabParam as "venta" | "alquiler" | "anticretico" | "proyectos" | "mapa"
      );
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
      setActiveTab(
        urlTab as "venta" | "alquiler" | "anticretico" | "proyectos" | "mapa"
      );
    }
  }, [searchParams]);

  // Handle pagination (client-side)
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  // Get properties to display on current page
  const displayedProperties = properties.slice(
    (currentPage - 1) * 6,
    currentPage * 6
  );

  const handlePropertyClick = (propertyId: string) => {
    router.push(`/property/${propertyId}`);
  };

  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
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

  const handleContactAgent = (phone?: string, property?: Property) => {
    if (phone) {
      let message =
        "Hola, me interesa obtener más información sobre una propiedad.";

      if (property) {
        const propertyUrl = `https://ubigroup.vercel.app/property/${property.id}`;
        const price = formatPrice(property.price, property.currency);
        const location = `${property.locationCity}, ${property.locationState}`;
        const transactionType = getTransactionTypeLabel(
          property.transactionType
        );
        const propertyType = getPropertyTypeLabel(property.type);

        message = `Hola, me interesa obtener más información sobre esta propiedad:

🏠 ${property.title}
📍 ${location}
💰 ${price}
🏢 ${propertyType} - ${transactionType}
🔗 ${propertyUrl}

¿Podrías proporcionarme más detalles?`;
      }

      const encodedMessage = encodeURIComponent(message);
      window.open(
        `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodedMessage}`,
        "_blank"
      );
    }
  };

  if (loading) {
    return (
      <section className="py-8 sm:py-16 bg-background">
        <div className="container">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              Cargando propiedades...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-16 bg-background dark" id="properties">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-4">
            {activeTab === "proyectos" ? (
              "Explora Proyectos"
            ) : (
              <>
                <span className="text-primary">Ubi</span>ca tu próxima propiedad
              </>
            )}
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            {activeTab === "proyectos"
              ? "Descubre proyectos activos y sus unidades disponibles."
              : "Explora nuestra selección de propiedades en venta, alquiler y anticrético."}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-4 sm:mb-6">
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

        {/* Property Map: keep mounted to avoid Leaflet re-init issues */}
        <div className="mb-8">
          <PropertyMap
            properties={
              activeTab === "proyectos"
                ? []
                : properties.filter((p) =>
                    isValidCoordinates(p.latitude, p.longitude)
                  )
            }
            projects={
              activeTab === "proyectos" || activeTab === "mapa"
                ? projects
                    .filter((p) => isValidCoordinates(p.latitude, p.longitude))
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
          <p className="text-muted-foreground">
            {activeTab === "proyectos"
              ? `${projects.length} proyecto${projects.length !== 1 ? "s" : ""} encontrado${projects.length !== 1 ? "s" : ""}`
              : activeTab === "mapa"
                ? `${pagination.totalCount} propiedades y ${projects.length} proyectos`
                : `${pagination.totalCount} propiedad${pagination.totalCount !== 1 ? "es" : ""} encontrada${pagination.totalCount !== 1 ? "s" : ""}`}
            {activeTab !== "proyectos" &&
              activeTab !== "mapa" &&
              pagination.totalPages > 1 && (
                <span className="ml-2">
                  (Mostrando {(pagination.page - 1) * pagination.limit + 1} -{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.totalCount
                  )}{" "}
                  de {pagination.totalCount})
                </span>
              )}
          </p>

          {/* View Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground">Vista:</span>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "cards" ? "default" : "secondary"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className="flex items-center gap-1"
              >
                <Grid3X3 className="h-4 w-4" />
                Tarjetas
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "secondary"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="flex items-center gap-1"
              >
                <List className="h-4 w-4" />
                Lista
              </Button>
            </div>
          </div>
        </div>

        {/* Properties Display */}
        {activeTab !== "proyectos" ? (
          properties.length === 0 ? (
            <div className="text-center py-12">
              <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No se encontraron propiedades
              </h3>
              <p className="text-muted-foreground">
                No hay propiedades disponibles en este momento
              </p>
            </div>
          ) : (
            <>
              {viewMode === "cards" ? (
                /* Card View */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedProperties.map((property) => (
                    <Card
                      key={property.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handlePropertyClick(property.id)}
                    >
                      {/* Property Image */}
                      <div className="relative h-48 bg-muted">
                        {property.images && property.images.length > 0 ? (
                          <Image
                            src={property.images[0]}
                            alt={property.title}
                            width={400}
                            height={192}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Home className="h-12 w-12 text-muted-foreground" />
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
                        <div className="grid grid-cols-3 gap-4 mb-4 text-sm text-muted-foreground">
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
                        <div className="mb-4 text-sm text-muted-foreground">
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
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {property.agent.firstName}{" "}
                              {property.agent.lastName}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
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
                                handleContactAgent(
                                  property.agent.phone,
                                  property
                                );
                              }}
                            >
                              <Phone className="h-4 w-4 mr-1" />
                              Llamar
                            </Button>
                          )}
                          {property.agent.phone && (
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContactAgent(
                                  property.agent.phone,
                                  property
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
                  {displayedProperties.map((property) => (
                    <Card
                      key={property.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handlePropertyClick(property.id)}
                    >
                      <div className="flex flex-row items-stretch gap-3 min-h-[6rem] sm:min-h-[8rem]">
                        {/* Property Image */}
                        <div className="relative w-28 sm:w-40 lg:w-64 self-stretch bg-muted flex-shrink-0 overflow-hidden rounded-md">
                          {property.images && property.images.length > 0 ? (
                            <Image
                              src={property.images[0]}
                              alt={property.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <Home className="h-12 w-12 text-muted-foreground" />
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
                                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground mb-1 sm:mb-2 line-clamp-1">
                                  {property.title}
                                </h3>
                                <p className="text-muted-foreground flex items-center gap-1 mb-1 sm:mb-2 text-sm">
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
                              <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3 text-sm text-muted-foreground">
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
                              <div className="flex sm:hidden items-center gap-3 mb-2 text-xs text-muted-foreground">
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
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">
                                    {property.agent.firstName}{" "}
                                    {property.agent.lastName}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-4">
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
                                      handleContactAgent(
                                        property.agent.phone,
                                        property
                                      );
                                    }}
                                  >
                                    <Phone className="h-4 w-4 mr-1" />
                                    Llamar
                                  </Button>
                                )}
                                {property.agent.phone && (
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleContactAgent(
                                        property.agent.phone,
                                        property
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
                                  handleContactAgent(
                                    property.agent.phone,
                                    property
                                  );
                                }}
                              >
                                <Phone className="h-4 w-4 mr-1" /> Llamar
                              </Button>
                            )}
                            {property.agent.phone && (
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleContactAgent(
                                    property.agent.phone,
                                    property
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
                <div className="flex flex-col items-center gap-4 mt-8">
                  {/* Page info */}
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {(pagination.page - 1) * pagination.limit + 1} -{" "}
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.totalCount
                      )}{" "}
                      de {pagination.totalCount} propiedades
                    </p>
                  </div>

                  {/* Pagination controls */}
                  <div className="flex justify-center items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="flex items-center gap-1 text-foreground border-border hover:bg-accent"
                    >
                      <ChevronLeft className="h-4 w-4" />
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
                              className={`w-10 h-10 ${
                                pagination.page === pageNum
                                  ? "bg-primary text-primary-foreground"
                                  : "text-foreground border-border hover:bg-accent"
                              }`}
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
                      className="flex items-center gap-1 text-foreground border-border hover:bg-accent"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
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
                    <div className="h-48 bg-muted animate-pulse" />
                    <div className="p-4 space-y-3">
                      <div className="h-6 w-32 bg-muted animate-pulse" />
                      <div className="h-4 w-full bg-muted animate-pulse" />
                      <div className="h-4 w-3/4 bg-muted animate-pulse" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : projectsError ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Error al cargar proyectos
                </h3>
                <p className="text-muted-foreground">{projectsError}</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No se encontraron proyectos
                </h3>
                <p className="text-muted-foreground">
                  Intenta ajustar tu búsqueda
                </p>
              </div>
            ) : (
              <>
                {viewMode === "cards" ? (
                  /* Projects Card View */
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                      <Card
                        key={project.id}
                        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                        onClick={() => router.push(`/project/${project.id}`)}
                      >
                        <div className="relative h-48 bg-muted">
                          {project.images && project.images.length > 0 ? (
                            <Image
                              src={project.images[0]}
                              alt={project.name}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Building2 className="h-10 w-10 text-muted-foreground" />
                            </div>
                          )}

                          {/* Status Badge */}
                          <div className="absolute top-2 left-2">
                            <Badge
                              variant={project.active ? "default" : "secondary"}
                              className="flex items-center gap-1"
                            >
                              <div
                                className={`w-2 h-2 rounded-full ${project.active ? "bg-green-400" : "bg-gray-400"}`}
                              />
                              {project.active ? "Activo" : "Inactivo"}
                            </Badge>
                          </div>

                          {/* Property Type Badge */}
                          <div className="absolute top-2 right-2">
                            <Badge
                              variant="outline"
                              className="bg-background/80 backdrop-blur-sm"
                            >
                              {project.propertyType === "HOUSE"
                                ? "Casa"
                                : project.propertyType === "APARTMENT"
                                  ? "Apartamento"
                                  : project.propertyType === "OFFICE"
                                    ? "Oficina"
                                    : "Terreno"}
                            </Badge>
                          </div>

                          {/* Image Count Indicator */}
                          {project.images && project.images.length > 1 && (
                            <div className="absolute bottom-2 right-2">
                              <Badge
                                variant="secondary"
                                className="bg-black/60 text-white"
                              >
                                {project.images.length} fotos
                              </Badge>
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <div className="mb-3">
                            <h3 className="font-semibold text-lg line-clamp-1 mb-1">
                              {project.name}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {project.description}
                            </p>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="mr-2 h-4 w-4" />
                              <span className="line-clamp-1">
                                {project.location}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                  Pisos:
                                </span>
                                <span className="font-medium">
                                  {project.floors?.length || 0}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                  Unidades:
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
                          </div>

                          <Separator className="my-3" />

                          <div className="flex items-center justify-between">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleProjectExpansion(project.id);
                              }}
                            >
                              {expandedProjects.has(project.id)
                                ? "Ver menos"
                                : "Ver más"}
                            </Button>
                            {project.latitude && project.longitude && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Open map view
                                }}
                              >
                                <MapPin className="h-3 w-3 mr-1" />
                                Mapa
                              </Button>
                            )}
                          </div>

                          {/* Expanded Content */}
                          {expandedProjects.has(project.id) && (
                            <div className="mt-4 pt-4 border-t">
                              <div className="space-y-3">
                                {/* Floors Information */}
                                {project.floors &&
                                  project.floors.length > 0 && (
                                    <div>
                                      <h4 className="font-medium text-sm mb-2">
                                        Pisos del proyecto:
                                      </h4>
                                      <div className="grid grid-cols-2 gap-2">
                                        {project.floors.map((floor) => (
                                          <div
                                            key={floor.id}
                                            className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                                          >
                                            <span className="text-sm">
                                              {floor.name ||
                                                `Piso ${floor.number}`}
                                            </span>
                                            <Badge
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              {floor.quadrants?.length || 0}{" "}
                                              unidades
                                            </Badge>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                {/* Additional Details */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">
                                      Tipo:
                                    </span>
                                    <p className="font-medium">
                                      {project.propertyType === "HOUSE"
                                        ? "Casa"
                                        : project.propertyType === "APARTMENT"
                                          ? "Apartamento"
                                          : project.propertyType === "OFFICE"
                                            ? "Oficina"
                                            : "Terreno"}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Estado:
                                    </span>
                                    <p className="font-medium">
                                      {project.active ? "Activo" : "Inactivo"}
                                    </p>
                                  </div>
                                </div>

                                {/* Location Details */}
                                {project.latitude && project.longitude && (
                                  <div className="p-3 bg-muted/30 rounded-md">
                                    <div className="flex items-center gap-2 text-sm">
                                      <MapPin className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium">
                                        Ubicación disponible
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Coordenadas: {project.latitude.toFixed(4)}
                                      , {project.longitude.toFixed(4)}
                                    </p>
                                  </div>
                                )}

                                {/* Full Description */}
                                <div>
                                  <h4 className="font-medium text-sm mb-2">
                                    Descripción completa:
                                  </h4>
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {project.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  /* Projects List View */
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <Card
                        key={project.id}
                        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                        onClick={() => router.push(`/project/${project.id}`)}
                      >
                        <div className="flex flex-col md:flex-row">
                          {/* Project Image */}
                          <div className="relative w-full md:w-48 h-48 md:h-auto bg-muted flex-shrink-0">
                            {project.images && project.images.length > 0 ? (
                              <Image
                                src={project.images[0]}
                                alt={project.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Building2 className="h-10 w-10 text-muted-foreground" />
                              </div>
                            )}

                            {/* Status Badge */}
                            <div className="absolute top-2 left-2">
                              <Badge
                                variant={
                                  project.active ? "default" : "secondary"
                                }
                                className="flex items-center gap-1"
                              >
                                <div
                                  className={`w-2 h-2 rounded-full ${project.active ? "bg-green-400" : "bg-gray-400"}`}
                                />
                                {project.active ? "Activo" : "Inactivo"}
                              </Badge>
                            </div>
                          </div>

                          {/* Project Details */}
                          <div className="flex-1 p-4">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-xl">
                                    {project.name}
                                  </h3>
                                  <Badge variant="outline">
                                    {project.propertyType === "HOUSE"
                                      ? "Casa"
                                      : project.propertyType === "APARTMENT"
                                        ? "Apartamento"
                                        : project.propertyType === "OFFICE"
                                          ? "Oficina"
                                          : "Terreno"}
                                  </Badge>
                                </div>
                                <p className="text-muted-foreground mb-3 line-clamp-2">
                                  {project.description}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="flex items-center text-sm">
                                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span className="line-clamp-1">
                                  {project.location}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Pisos:
                                </span>
                                <span className="font-medium">
                                  {project.floors?.length || 0}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Unidades:
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

                            <Separator className="my-3" />

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {project.images &&
                                  project.images.length > 0 && (
                                    <span>{project.images.length} fotos</span>
                                  )}
                                {project.latitude && project.longitude && (
                                  <span>• Ubicación disponible</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleProjectExpansion(project.id);
                                  }}
                                >
                                  {expandedProjects.has(project.id)
                                    ? "Ver menos"
                                    : "Ver más"}
                                </Button>
                                {project.latitude && project.longitude && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // TODO: Open map view
                                    }}
                                  >
                                    <MapPin className="h-3 w-3 mr-1" />
                                    Mapa
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Expanded Content for List View */}
                            {expandedProjects.has(project.id) && (
                              <div className="mt-4 pt-4 border-t">
                                <div className="space-y-4">
                                  {/* Floors Information */}
                                  {project.floors &&
                                    project.floors.length > 0 && (
                                      <div>
                                        <h4 className="font-medium text-sm mb-3">
                                          Pisos del proyecto:
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                          {project.floors.map((floor) => (
                                            <div
                                              key={floor.id}
                                              className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                                            >
                                              <span className="text-sm font-medium">
                                                {floor.name ||
                                                  `Piso ${floor.number}`}
                                              </span>
                                              <Badge
                                                variant="outline"
                                                className="text-xs"
                                              >
                                                {floor.quadrants?.length || 0}{" "}
                                                unidades
                                              </Badge>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                  {/* Additional Details */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <span className="text-muted-foreground text-sm">
                                        Tipo de propiedad:
                                      </span>
                                      <p className="font-medium">
                                        {project.propertyType === "HOUSE"
                                          ? "Casa"
                                          : project.propertyType === "APARTMENT"
                                            ? "Apartamento"
                                            : project.propertyType === "OFFICE"
                                              ? "Oficina"
                                              : "Terreno"}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground text-sm">
                                        Estado del proyecto:
                                      </span>
                                      <p className="font-medium">
                                        {project.active ? "Activo" : "Inactivo"}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground text-sm">
                                        Total de unidades:
                                      </span>
                                      <p className="font-medium">
                                        {project.floors?.reduce(
                                          (total, floor) =>
                                            total +
                                            (floor.quadrants?.length || 0),
                                          0
                                        ) || 0}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Location Details */}
                                  {project.latitude && project.longitude && (
                                    <div className="p-4 bg-muted/30 rounded-md">
                                      <div className="flex items-center gap-2 mb-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">
                                          Información de ubicación
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                        <div>
                                          <span className="text-muted-foreground">
                                            Latitud:
                                          </span>
                                          <p className="font-mono">
                                            {project.latitude.toFixed(6)}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">
                                            Longitud:
                                          </span>
                                          <p className="font-mono">
                                            {project.longitude.toFixed(6)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Full Description */}
                                  <div>
                                    <h4 className="font-medium text-sm mb-2">
                                      Descripción completa del proyecto:
                                    </h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                      {project.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
