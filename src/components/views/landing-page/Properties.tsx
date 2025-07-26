"use client";

import { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Home,
  Building2,
  Car,
  Bath,
  Bed,
  Users,
  Phone,
  MessageCircle,
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

interface Property {
  id: string;
  title: string;
  description: string;
  type: "HOUSE" | "APARTMENT" | "OFFICE" | "LAND";
  locationState: string;
  locationCity: string;
  locationNeigh: string;
  address?: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  garageSpaces: number;
  squareMeters: number;
  transactionType: "SALE" | "RENT";
  status: "PENDING" | "APPROVED" | "REJECTED";
  images: string[];
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

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch properties from API
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch("/api/properties");
        if (response.ok) {
          const data = await response.json();
          setProperties(data.properties || []);
        }
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Filter properties based on search criteria
  useEffect(() => {
    let filtered = properties.filter((property) => {
      // Only show approved properties
      if (property.status !== "APPROVED") return false;

      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch =
          property.title.toLowerCase().includes(searchLower) ||
          property.description.toLowerCase().includes(searchLower) ||
          property.locationCity.toLowerCase().includes(searchLower) ||
          property.locationState.toLowerCase().includes(searchLower) ||
          property.locationNeigh.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Property type filter
      if (
        filters.propertyType &&
        filters.propertyType !== "ALL" &&
        property.type !== filters.propertyType
      )
        return false;

      // Transaction type filter
      if (
        filters.transactionType &&
        filters.transactionType !== "ALL" &&
        property.transactionType !== filters.transactionType
      )
        return false;

      // Location filters
      if (
        filters.locationState &&
        filters.locationState !== "ALL" &&
        property.locationState !== filters.locationState
      )
        return false;
      if (
        filters.locationCity &&
        filters.locationCity !== "ALL" &&
        property.locationCity !== filters.locationCity
      )
        return false;

      // Price range filter
      if (filters.minPrice && property.price < parseFloat(filters.minPrice))
        return false;
      if (filters.maxPrice && property.price > parseFloat(filters.maxPrice))
        return false;

      // Bedrooms filter
      if (
        filters.minBedrooms &&
        property.bedrooms < parseInt(filters.minBedrooms)
      )
        return false;
      if (
        filters.maxBedrooms &&
        property.bedrooms > parseInt(filters.maxBedrooms)
      )
        return false;

      // Bathrooms filter
      if (
        filters.minBathrooms &&
        property.bathrooms < parseInt(filters.minBathrooms)
      )
        return false;
      if (
        filters.maxBathrooms &&
        property.bathrooms > parseInt(filters.maxBathrooms)
      )
        return false;

      return true;
    });

    setFilteredProperties(filtered);
  }, [properties, filters]);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
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
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price);
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
    return type === "SALE" ? "Venta" : "Alquiler";
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
                  {Array.from(
                    new Set(properties.map((p) => p.locationState))
                  ).map((state) => (
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
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ciudad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas las ciudades</SelectItem>
                  {Array.from(
                    new Set(properties.map((p) => p.locationCity))
                  ).map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
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

              {/* Clear Filters */}
              <div className="lg:col-span-4 flex justify-center">
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredProperties.length} propiedad
            {filteredProperties.length !== 1 ? "es" : ""} encontrada
            {filteredProperties.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Properties Grid */}
        {filteredProperties.length === 0 ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <Card
                key={property.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
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
                      {formatPrice(property.price)}
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
                        {property.features.slice(0, 3).map((feature, index) => (
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
                        onClick={() => handleContactAgent(property.agent.phone)}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Llamar
                      </Button>
                    )}
                    {property.agent.whatsapp && (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          handleContactAgent(undefined, property.agent.whatsapp)
                        }
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
        )}
      </div>
    </section>
  );
}
