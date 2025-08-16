"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Clock, CheckCircle, XCircle, Download } from "lucide-react";
import {
  useAgencyProperties,
  type UseAgencyPropertiesParams,
} from "@/hooks/use-agency-properties";
import { PropertyStatus } from "@prisma/client";
import Link from "next/link";
import { exportToCSV } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import {
  PropertyFilters,
  type PropertyFilters as PropertyFiltersType,
} from "./property-filters";

export function AgencyPropertyManagement() {
  const [params, setParams] = useState<UseAgencyPropertiesParams>({
    page: 1,
    limit: 10,
  });
  const [filters, setFilters] = useState<PropertyFiltersType>({});

  // Merge filters with params
  const queryParams = {
    ...params,
    ...filters,
  };

  const { data, isLoading, error } = useAgencyProperties(queryParams);

  const handleFiltersChange = (newFilters: PropertyFiltersType) => {
    setFilters(newFilters);
    setParams((prev) => ({ ...prev, page: 1 })); // Reset to first page when filters change
  };

  const handlePageChange = (page: number) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const handleDownloadCSV = () => {
    if (!data?.properties || data.properties.length === 0) {
      toast({
        title: "No hay datos",
        description: "No hay propiedades para exportar",
        variant: "destructive",
      });
      return;
    }

    // Transform data for CSV export
    const csvData = data.properties.map((property) => ({
      ID: property.id,
      Título: property.title,
      Descripción: property.description,
      Agente:
        `${property.agent?.firstName || ""} ${property.agent?.lastName || ""}`.trim() ||
        "N/A",
      Precio:
        property.currency === "DOLLARS"
          ? `$${property.price.toLocaleString()}`
          : `Bs ${property.price.toLocaleString()}`,
      Moneda: property.currency,
      Tipo_Propiedad: property.type,
      Tipo_Transacción: property.transactionType,
      Dirección: property.address || property.locationNeigh,
      Ciudad: property.locationCity,
      Estado: property.locationState,
      Habitaciones: property.bedrooms,
      Baños: property.bathrooms,
      Área: property.squareMeters,
      Estado_Aprobación: property.status,
      Fecha_Envío: new Date(property.createdAt).toLocaleDateString(),
      Fecha_Actualización: new Date(property.updatedAt).toLocaleDateString(),
    }));

    exportToCSV(csvData, "propiedades-agencia");

    toast({
      title: "Descarga iniciada",
      description: "El archivo CSV se está descargando",
    });
  };

  const getStatusBadge = (status: PropertyStatus) => {
    const variants = {
      PENDING: "secondary",
      APPROVED: "default",
      REJECTED: "destructive",
    } as const;

    const icons = {
      PENDING: Clock,
      APPROVED: CheckCircle,
      REJECTED: XCircle,
    };

    const Icon = icons[status];

    return (
      <div className="flex items-center gap-2">
        <Badge variant={variants[status]} className="flex items-center gap-1">
          <Icon className="h-3 w-3" />
          <span className="hidden sm:inline">{status}</span>
          <span className="sm:hidden">{status.charAt(0)}</span>
        </Badge>
      </div>
    );
  };

  const getStatusStats = () => {
    if (!data?.properties) return { pending: 0, approved: 0, rejected: 0 };

    return data.properties.reduce(
      (acc, property) => {
        acc[property.status.toLowerCase() as keyof typeof acc]++;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 }
    );
  };

  const stats = getStatusStats();

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Error al cargar las propiedades</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Status Overview Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">
                    {stats.pending}
                  </p>
                  <p className="text-xs text-muted-foreground">En Revisión</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">
                    {stats.approved}
                  </p>
                  <p className="text-xs text-muted-foreground">Aprobadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 md:col-span-1">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-red-100 rounded-full">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">
                    {stats.rejected}
                  </p>
                  <p className="text-xs text-muted-foreground">Rechazadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Total Properties Card */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gray-100 rounded-full">
                <svg
                  className="h-4 w-4 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">
                  {data?.totalCount || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total Properties
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Properties Table */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">
                  Property Management
                </CardTitle>
                <CardDescription className="text-sm">
                  View and manage all properties submitted by your agents
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownloadCSV}
                  disabled={!data?.properties || data.properties.length === 0}
                  className="w-full sm:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">Export</span>
                </Button>
                {stats.pending > 0 && (
                  <Button asChild className="w-full sm:w-auto">
                    <Link href="/properties/pending">
                      <Clock className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">
                        Review Pending ({stats.pending})
                      </span>
                      <span className="sm:hidden">
                        Pending ({stats.pending})
                      </span>
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {/* Filters */}
            <PropertyFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              showStatusFilter={true}
            />

            {/* Table */}
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : data?.properties.length === 0 ? (
              <div className="text-center py-10">
                <div className="mx-auto h-24 w-24 text-muted-foreground/20">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium">
                  No properties found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {Object.keys(filters).length > 0
                    ? "No properties match your current filters"
                    : "No properties have been submitted yet"}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block sm:hidden space-y-4">
                  {data?.properties.map((property) => (
                    <Card key={property.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-sm">
                              {property.title}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {property.address || property.locationNeigh},{" "}
                              {property.locationCity}
                            </p>
                          </div>
                          {getStatusBadge(property.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-muted-foreground">
                              Agent:
                            </span>
                            <p className="font-medium">
                              {property.agent.firstName || ""}{" "}
                              {property.agent.lastName || ""}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Type:</span>
                            <p className="font-medium">{property.type}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Price:
                            </span>
                            <p className="font-medium">
                              {property.currency === "DOLLARS" ? (
                                <>${property.price.toLocaleString()}</>
                              ) : (
                                <>Bs {property.price.toLocaleString()}</>
                              )}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date:</span>
                            <p className="font-medium">
                              {new Date(
                                property.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/properties/${property.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.properties.map((property) => (
                        <TableRow key={property.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {property.title}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {property.address || property.locationNeigh},{" "}
                                {property.locationCity},{" "}
                                {property.locationState}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {property.agent.firstName || ""}{" "}
                                {property.agent.lastName || ""}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {property.agent.phone ||
                                  property.agent.phone ||
                                  "Sin contacto"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{property.type}</div>
                              <div className="text-muted-foreground">
                                {property.transactionType}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {property.currency === "DOLLARS" ? (
                              <>
                                ${property.price.toLocaleString()}
                                {property.exchangeRate && (
                                  <div className="text-xs text-muted-foreground">
                                    ≈ Bs{" "}
                                    {(
                                      property.price * property.exchangeRate
                                    ).toLocaleString()}
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                Bs {property.price.toLocaleString()}
                                {property.exchangeRate && (
                                  <div className="text-xs text-muted-foreground">
                                    ≈ $
                                    {(
                                      property.price / property.exchangeRate
                                    ).toLocaleString()}
                                  </div>
                                )}
                              </>
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(property.status)}
                          </TableCell>
                          <TableCell>
                            {new Date(property.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                asChild
                                title="View Property Details"
                              >
                                <Link href={`/properties/${property.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {data && data.pagination.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
                    <p className="text-sm text-muted-foreground text-center sm:text-left">
                      Showing {(data.pagination.page - 1) * params.limit! + 1}{" "}
                      to{" "}
                      {Math.min(
                        data.pagination.page * params.limit!,
                        data.totalCount
                      )}{" "}
                      of {data.totalCount} properties
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handlePageChange(data.pagination.page - 1)
                        }
                        disabled={data.pagination.page <= 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {data.pagination.page} of{" "}
                        {data.pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handlePageChange(data.pagination.page + 1)
                        }
                        disabled={
                          data.pagination.page >= data.pagination.totalPages
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
