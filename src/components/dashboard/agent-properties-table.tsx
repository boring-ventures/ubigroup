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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2, Eye, Search, Plus, AlertCircle } from "lucide-react";
import {
  useAgentProperties,
  type UseAgentPropertiesParams,
} from "@/hooks/use-agent-properties";
import { PropertyStatus } from "@prisma/client";
import { toast } from "@/components/ui/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Link from "next/link";

export function AgentPropertiesTable() {
  const [params, setParams] = useState<UseAgentPropertiesParams>({
    page: 1,
    limit: 10,
  });
  const [search, setSearch] = useState("");
  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading, error, refetch } = useAgentProperties(params);

  const handleSearch = (value: string) => {
    setSearch(value);
    setParams((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleStatusFilter = (status: PropertyStatus | "all") => {
    setParams((prev) => ({
      ...prev,
      status: status === "all" ? undefined : status,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const handleDeleteProperty = async (propertyId: string) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete property");
      }

      toast({
        title: "Éxito",
        description: "Propiedad eliminada exitosamente",
      });

      refetch();
    } catch (error) {
      console.error("Error deleting property:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al eliminar la propiedad",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeletePropertyId(null);
    }
  };

  const getStatusBadge = (status: PropertyStatus, rejectionReason?: string) => {
    const variants = {
      PENDING: "secondary",
      APPROVED: "default",
      REJECTED: "destructive",
    } as const;

    const labels = {
      PENDING: "Pendiente",
      APPROVED: "Aprobado",
      REJECTED: "Rechazado",
    };

    return (
      <div className="flex items-center gap-2">
        <Badge variant={variants[status]}>{labels[status]}</Badge>
        {status === "REJECTED" && rejectionReason && (
          <AlertCircle className="h-4 w-4 text-destructive cursor-help" />
        )}
      </div>
    );
  };

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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mis Propiedades</CardTitle>
              <CardDescription>
                Gestiona tus listados de propiedades y rastrea su estado
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/properties/create">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Propiedad
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar propiedades..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={params.status || "all"}
              onValueChange={(value) =>
                handleStatusFilter(value as PropertyStatus | "all")
              }
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="APPROVED">Aprobado</SelectItem>
                <SelectItem value="REJECTED">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                No se encontraron propiedades
              </h3>
              <p className="text-muted-foreground mb-4">
                {params.status || search
                  ? "Ninguna propiedad coincide con tus filtros actuales"
                  : "Aún no has creado ninguna propiedad"}
              </p>
              {!params.status && !search && (
                <Button asChild>
                  <Link href="/properties/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear tu Primera Propiedad
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Propiedad</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.properties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{property.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {property.address}, {property.city},{" "}
                              {property.state}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{property.propertyType}</div>
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
                          {getStatusBadge(
                            property.status,
                            property.rejectionReason
                          )}
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
                              title="Ver Detalles de la Propiedad"
                            >
                              <Link href={`/properties/${property.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button size="sm" variant="ghost" asChild>
                              <Link href={`/properties/${property.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeletePropertyId(property.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(data.currentPage - 1) * params.limit! + 1} a{" "}
                    {Math.min(data.currentPage * params.limit!, data.total)} de{" "}
                    {data.total} propiedades
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(data.currentPage - 1)}
                      disabled={data.currentPage <= 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm">
                      Página {data.currentPage} de {data.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(data.currentPage + 1)}
                      disabled={data.currentPage >= data.totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletePropertyId}
        onOpenChange={(open) => !open && setDeletePropertyId(null)}
        title="Eliminar Propiedad"
        description="¿Estás seguro de que quieres eliminar esta propiedad? Esta acción no se puede deshacer."
        onConfirm={() =>
          deletePropertyId && handleDeleteProperty(deletePropertyId)
        }
      />
    </>
  );
}
