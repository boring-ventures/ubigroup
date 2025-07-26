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
        title: "Success",
        description: "Property deleted successfully",
      });

      refetch();
    } catch (error) {
      console.error("Error deleting property:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete property",
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

    return (
      <div className="flex items-center gap-2">
        <Badge variant={variants[status]}>{status}</Badge>
        {status === "REJECTED" && rejectionReason && (
          <AlertCircle
            className="h-4 w-4 text-destructive cursor-help"
            title={rejectionReason}
          />
        )}
      </div>
    );
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load properties</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Properties</CardTitle>
              <CardDescription>
                Manage your property listings and track their status
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/properties/create">
                <Plus className="mr-2 h-4 w-4" />
                Add Property
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
                placeholder="Search properties..."
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
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
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
              <h3 className="mt-4 text-lg font-medium">No properties found</h3>
              <p className="text-muted-foreground mb-4">
                {params.status || search
                  ? "No properties match your current filters"
                  : "You haven't created any properties yet"}
              </p>
              {!params.status && !search && (
                <Button asChild>
                  <Link href="/properties/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Property
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
                      <TableHead>Property</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
                          ${property.price.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(
                            property.status,
                            property.rejectionReason
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(property.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {property.status === "APPROVED" && (
                              <Button size="sm" variant="ghost" asChild>
                                <Link
                                  href={`/property/${property.id}`}
                                  target="_blank"
                                >
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
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
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(data.currentPage - 1) * params.limit! + 1} to{" "}
                    {Math.min(data.currentPage * params.limit!, data.total)} of{" "}
                    {data.total} properties
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(data.currentPage - 1)}
                      disabled={data.currentPage <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {data.currentPage} of {data.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(data.currentPage + 1)}
                      disabled={data.currentPage >= data.totalPages}
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletePropertyId}
        onOpenChange={(open) => !open && setDeletePropertyId(null)}
        title="Delete Property"
        description="Are you sure you want to delete this property? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() =>
          deletePropertyId && handleDeleteProperty(deletePropertyId)
        }
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
