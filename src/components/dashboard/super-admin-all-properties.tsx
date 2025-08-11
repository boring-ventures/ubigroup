"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Home,
  Search,
  CheckCircle,
  Clock,
  MapPin,
  DollarSign,
  Eye,
  Building2,
} from "lucide-react";
import { PropertyDetailsModal } from "./property-details-modal";
import Image from "next/image";

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
  squareMeters: number;
  transactionType: string;
  status: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
  agent: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  agency: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
}

interface PropertyStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalValue: number;
  averagePrice: number;
}

interface Agency {
  id: string;
  name: string;
  logoUrl: string | null;
}

export function SuperAdminAllProperties() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [agencyFilter, setAgencyFilter] = useState<string>("all");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    null
  );
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);

  // Fetch all properties
  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: [
      "super-admin-properties",
      searchTerm,
      statusFilter,
      typeFilter,
      agencyFilter,
    ],
    queryFn: async (): Promise<Property[]> => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (agencyFilter !== "all") params.append("agencyId", agencyFilter);

      const response = await fetch(`/api/properties?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch properties");
      }
      const data = await response.json();
      return data.properties || [];
    },
  });

  // Fetch property statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["super-admin-property-stats"],
    queryFn: async (): Promise<PropertyStats> => {
      const response = await fetch("/api/properties/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch property stats");
      }
      return response.json();
    },
  });

  // Fetch agencies for filter
  const { data: agencies = [] } = useQuery({
    queryKey: ["agencies-for-filter"],
    queryFn: async () => {
      const response = await fetch("/api/agencies");
      if (!response.ok) {
        throw new Error("Failed to fetch agencies");
      }
      const data = await response.json();
      return data.agencies || [];
    },
  });

  const handleViewProperty = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setIsPropertyModalOpen(true);
  };

  const handleClosePropertyModal = () => {
    setIsPropertyModalOpen(false);
    setSelectedPropertyId(null);
  };

  const getTransactionBadge = (type: string) => {
    return (
      <Badge
        variant={type === "SALE" ? "default" : "secondary"}
        className={`${
          type === "SALE"
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-green-600 hover:bg-green-700 text-white"
        }`}
      >
        {type === "SALE" ? "Venta" : "Alquiler"}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: "secondary",
      APPROVED: "default",
      REJECTED: "destructive",
    } as const;

    const icons = {
      PENDING: Clock,
      APPROVED: CheckCircle,
      REJECTED: CheckCircle, // You might want to use a different icon for rejected
    };

    const Icon = icons[status as keyof typeof icons] || CheckCircle;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
    }).format(price);
  };

  if (propertiesLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Home className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    Propiedades totales
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    Pendientes de revisión
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.approved || 0}</p>
                  <p className="text-xs text-muted-foreground">Aprobadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-100 rounded-full">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {formatPrice(stats?.totalValue || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Valor total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar propiedades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="APPROVED">Aprobado</SelectItem>
                  <SelectItem value="REJECTED">Rechazado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="HOUSE">Casa</SelectItem>
                  <SelectItem value="APARTMENT">Departamento</SelectItem>
                  <SelectItem value="OFFICE">Oficina</SelectItem>
                  <SelectItem value="LAND">Terreno</SelectItem>
                </SelectContent>
              </Select>

              <Select value={agencyFilter} onValueChange={setAgencyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por agencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las agencias</SelectItem>
                  {agencies.map((agency: Agency) => (
                    <SelectItem key={agency.id} value={agency.id}>
                      {agency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Properties Table */}
        <Card>
          <CardHeader>
            <CardTitle>Todas las propiedades</CardTitle>
            <CardDescription>
              Gestión y supervisión de propiedades de toda la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Propiedad</TableHead>
                    <TableHead>Agente</TableHead>
                    <TableHead>Agencia</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creada</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        No se encontraron propiedades
                      </TableCell>
                    </TableRow>
                  ) : (
                    properties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                              {property.images.length > 0 ? (
                                <Image
                                  src={property.images[0]}
                                  alt={property.title}
                                  width={24}
                                  height={24}
                                  className="w-full h-full object-cover rounded-md"
                                />
                              ) : (
                                <Home className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">
                                {property.title}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {property.type} • {property.bedrooms} hab{" "}
                                {property.bathrooms} baños
                              </div>
                              <div className="flex space-x-1 mt-1">
                                {getTransactionBadge(property.transactionType)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={property.agent.avatarUrl || ""}
                              />
                              <AvatarFallback>
                                {property.agent.firstName?.[0]}
                                {property.agent.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium">
                                {property.agent.firstName}{" "}
                                {property.agent.lastName}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {property.agency.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {property.locationNeigh}, {property.locationCity}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatPrice(property.price)}
                        </TableCell>
                        <TableCell>{getStatusBadge(property.status)}</TableCell>
                        <TableCell>
                          {new Date(property.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewProperty(property.id)}
                              title="Ver detalles de la propiedad"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Property Details Modal */}
      <PropertyDetailsModal
        propertyId={selectedPropertyId}
        isOpen={isPropertyModalOpen}
        onClose={handleClosePropertyModal}
      />
    </>
  );
}
