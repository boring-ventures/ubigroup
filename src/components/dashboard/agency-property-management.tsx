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
import {
  Eye,
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  useAgencyProperties,
  type UseAgencyPropertiesParams,
} from "@/hooks/use-agency-properties";
import { PropertyStatus } from "@prisma/client";
import Link from "next/link";

export function AgencyPropertyManagement() {
  const [params, setParams] = useState<UseAgencyPropertiesParams>({
    page: 1,
    limit: 10,
  });
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useAgencyProperties(params);

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

  const getStatusBadge = (status: PropertyStatus, rejectionReason?: string) => {
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
          {status}
        </Badge>
        {status === "REJECTED" && rejectionReason && (
          <AlertCircle
            className="h-4 w-4 text-destructive cursor-help"
            title={rejectionReason}
          />
        )}
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
          <p className="text-destructive">Failed to load properties</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
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
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 rounded-full">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.rejected}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gray-100 rounded-full">
                <Filter className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data?.total || 0}</p>
                <p className="text-xs text-muted-foreground">
                  Total Properties
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Property Management</CardTitle>
              <CardDescription>
                View and manage all properties submitted by your agents
              </CardDescription>
            </div>
            {stats.pending > 0 && (
              <Button asChild>
                <Link href="/properties/pending">
                  <Clock className="mr-2 h-4 w-4" />
                  Review Pending ({stats.pending})
                </Link>
              </Button>
            )}
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
              <p className="text-muted-foreground">
                {params.status || search
                  ? "No properties match your current filters"
                  : "No properties have been submitted by your agents yet"}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
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
                            <div className="font-medium">{property.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {property.address}, {property.city},{" "}
                              {property.state}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {property.agent.firstName}{" "}
                              {property.agent.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {property.agent.email}
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
                            {property.status === "PENDING" && (
                              <Button size="sm" asChild>
                                <Link
                                  href={`/properties/pending?id=${property.id}`}
                                >
                                  Review
                                </Link>
                              </Button>
                            )}
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
    </div>
  );
}
