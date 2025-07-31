"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { PropertyMap } from "@/components/public/property-map";

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
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    limit: 9,
    offset: 0,
    page: 1,
    totalPages: 1,
    totalCount: 0,
    hasMore: false,
  });
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: "",
    propertyType: "ALL",
    transactionType: "ALL",
    locationState: "ALL",
    locationCity: "ALL",
    minPrice: "",
    maxPrice: "",
    minBedrooms: "",
    maxBedrooms: "",
    minBathrooms: "",
    maxBathrooms: "",
  });

  // Fetch properties from API with search and pagination
  const fetchProperties = async (searchFilters?: SearchFilters, page = 1) => {
    try {
      setSearchLoading(true);
      const params = new URLSearchParams();

      // Add pagination params
      const limit = 9;
      const offset = (page - 1) * limit;
      params.append("limit", limit.toString());
      params.append("offset", offset.toString());
      params.append("sortBy", "createdAt");
      params.append("sortOrder", "desc");

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
        if (
          searchFilters.transactionType &&
          searchFilters.transactionType !== "ALL"
        ) {
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
      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties || []);
        setPagination({
          limit: data.pagination.limit,
          offset: data.pagination.offset,
          page: data.pagination.page,
          totalPages: data.pagination.totalPages,
          totalCount: data.totalCount,
          hasMore: data.hasMore,
        });
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchProperties();
  }, []);

  // Handle search button click
  const handleSearch = () => {
    fetchProperties(filters, 1);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    fetchProperties(filters, newPage);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    const clearedFilters = {
      searchTerm: "",
      propertyType: "ALL",
      transactionType: "ALL",
      locationState: "ALL",
      locationCity: "ALL",
      minPrice: "",
      maxPrice: "",
      minBedrooms: "",
      maxBedrooms: "",
      minBathrooms: "",
      maxBathrooms: "",
    };
    setFilters(clearedFilters);
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
            Encuentra tu Propiedad Ideal
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explora nuestra amplia selección de propiedades en venta y alquiler.
            Filtra por ubicación, precio y características para encontrar la
            opción perfecta.
          </p>
        </div>

        {/* Search Filters */}
        <Card className="mb-8">
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
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
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

              {/* Transaction Type */}
              <Select
                value={filters.transactionType}
                onValueChange={(value) =>
                  handleFilterChange("transactionType", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de transacción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="SALE">Venta</SelectItem>
                  <SelectItem value="RENT">Alquiler</SelectItem>
                  <SelectItem value="ANTICRÉTICO">Anticrético</SelectItem>
                </SelectContent>
              </Select>

              {/* Location State */}
              <Select
                value={filters.locationState}
                onValueChange={(value) =>
                  handleFilterChange("locationState", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los estados</SelectItem>
                  <SelectItem value="Caracas">Caracas</SelectItem>
                  <SelectItem value="Valencia">Valencia</SelectItem>
                  <SelectItem value="Maracaibo">Maracaibo</SelectItem>
                  <SelectItem value="Barquisimeto">Barquisimeto</SelectItem>
                </SelectContent>
              </Select>

              {/* Location City */}
              <Select
                value={filters.locationCity}
                onValueChange={(value) =>
                  handleFilterChange("locationCity", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ciudad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas las ciudades</SelectItem>
                  <SelectItem value="Caracas">Caracas</SelectItem>
                  <SelectItem value="Valencia">Valencia</SelectItem>
                  <SelectItem value="Maracaibo">Maracaibo</SelectItem>
                  <SelectItem value="Barquisimeto">Barquisimeto</SelectItem>
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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

        {/* Property Map */}
        {properties.length > 0 && (
          <div className="mb-8">
            <PropertyMap
              properties={properties.filter((p) => p.latitude && p.longitude)}
              className="w-full"
            />
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {pagination.totalCount} propiedad
            {pagination.totalCount !== 1 ? "es" : ""} encontrada
            {pagination.totalCount !== 1 ? "s" : ""}
            {pagination.totalPages > 1 && (
              <span className="ml-2">
                (Página {pagination.page} de {pagination.totalPages})
              </span>
            )}
          </p>
        </div>

        {/* Properties Grid */}
        {properties.length === 0 ? (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <Card
                  key={property.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handlePropertyClick(property.id)}
                >
                  {/* Property Image */}
                  <div className="relative h-48 bg-gray-200">
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
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
                          {property.agent.firstName} {property.agent.lastName}
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
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pagination.page === pageNum ? "default" : "outline"
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
        )}
      </div>
    </section>
  );
}
