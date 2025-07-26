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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  Clock,
  Home,
  Bed,
  Bath,
  MapPin,
  XCircle,
} from "lucide-react";
import {
  usePendingProperties,
  useUpdatePropertyStatus,
  type UsePendingPropertiesParams,
} from "@/hooks/use-pending-properties";
import { toast } from "@/components/ui/use-toast";

export function PendingPropertiesApproval() {
  const [params, setParams] = useState<UsePendingPropertiesParams>({
    page: 1,
    limit: 5, // Show fewer per page for detailed review
  });
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );

  const { data, isLoading, error } = usePendingProperties(params);
  const updateStatusMutation = useUpdatePropertyStatus();

  const handlePageChange = (page: number) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const handleApprove = (propertyId: string) => {
    setSelectedProperty(propertyId);
    setActionType("approve");
  };

  const handleReject = (propertyId: string) => {
    setSelectedProperty(propertyId);
    setActionType("reject");
    setRejectionReason("");
  };

  const handleConfirmAction = async () => {
    if (!selectedProperty || !actionType) return;

    try {
      await updateStatusMutation.mutateAsync({
        propertyId: selectedProperty,
        status: actionType === "approve" ? "APPROVED" : "REJECTED",
        rejectionReason: actionType === "reject" ? rejectionReason : undefined,
      });

      toast({
        title: "Success",
        description: `Property ${actionType === "approve" ? "approved" : "rejected"} successfully`,
      });

      setSelectedProperty(null);
      setActionType(null);
      setRejectionReason("");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update property status",
        variant: "destructive",
      });
    }
  };

  const closeDialog = () => {
    setSelectedProperty(null);
    setActionType(null);
    setRejectionReason("");
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load pending properties</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Property Approvals
          </CardTitle>
          <CardDescription>
            Review and approve or reject property listings submitted by your
            agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Skeleton className="h-24 w-32" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-[250px]" />
                        <Skeleton className="h-4 w-[300px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                      <div className="space-x-2">
                        <Skeleton className="h-9 w-20" />
                        <Skeleton className="h-9 w-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !data?.properties || data.properties.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500/40" />
              <h3 className="mt-4 text-lg font-medium">All caught up!</h3>
              <p className="text-muted-foreground">
                No pending properties require your review at this time.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {data?.properties?.map((property) => (
                  <Card
                    key={property.id}
                    className="border-l-4 border-l-yellow-500"
                  >
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Property Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="text-lg font-semibold">
                              {property.title}
                            </h3>
                            <div className="flex items-center text-sm text-muted-foreground space-x-4">
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span>
                                  {property.address}, {property.city},{" "}
                                  {property.state}
                                </span>
                              </div>
                              <Badge variant="secondary">
                                {property.propertyType} •{" "}
                                {property.transactionType}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              ${property.price.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Submitted{" "}
                              {new Date(
                                property.createdAt
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        {/* Property Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y">
                          <div className="flex items-center space-x-2">
                            <Bed className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {property.bedrooms} bed
                              {property.bedrooms !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Bath className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {property.bathrooms} bath
                              {property.bathrooms !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {property.area.toLocaleString()} sq ft
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">by </span>
                            <span className="font-medium">
                              {property.agent.firstName}{" "}
                              {property.agent.lastName}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {property.description}
                          </p>
                        </div>

                        {/* Features */}
                        {property.features.length > 0 && (
                          <div>
                            <div className="flex flex-wrap gap-2">
                              {property.features
                                .slice(0, 4)
                                .map((feature, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {feature}
                                  </Badge>
                                ))}
                              {property.features.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{property.features.length - 4} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end space-x-3 pt-4">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleReject(property.id)}
                            disabled={updateStatusMutation.isPending}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(property.id)}
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(data.currentPage - 1) * params.limit! + 1} to{" "}
                    {Math.min(data.currentPage * params.limit!, data.total)} of{" "}
                    {data.total} pending properties
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

      {/* Approval/Rejection Dialog */}
      <Dialog
        open={!!selectedProperty}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve"
                ? "Approve Property"
                : "Reject Property"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "This property will be approved and made visible to the public."
                : "Please provide a reason for rejecting this property listing."}
            </DialogDescription>
          </DialogHeader>

          {actionType === "reject" && (
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please explain why this property is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={updateStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={
                updateStatusMutation.isPending ||
                (actionType === "reject" && !rejectionReason.trim())
              }
              variant={actionType === "approve" ? "default" : "destructive"}
            >
              {updateStatusMutation.isPending
                ? "Processing..."
                : actionType === "approve"
                  ? "Approve Property"
                  : "Reject Property"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
