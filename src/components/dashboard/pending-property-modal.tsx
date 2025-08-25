"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Phone,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  User,
  DollarSign,
  FileText,
  Building2,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

import Image from "next/image";
import { useUpdatePropertyStatus } from "@/hooks/use-pending-properties";

interface Property {
  id: string;
  title: string;
  description: string;
  propertyType: string; // From API transformation
  transactionType: string;
  address: string;
  city: string; // From API transformation (locationCity)
  state: string; // From API transformation (locationState)
  zipCode: string;
  price: number;
  currency: string;
  exchangeRate: number | null;
  bedrooms: number;
  bathrooms: number;
  area: number; // From API transformation (squareMeters)
  features: string[];
  images: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  agent: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  };
}

interface PendingPropertyModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PendingPropertyModal({
  property,
  isOpen,
  onClose,
}: PendingPropertyModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );

  const queryClient = useQueryClient();
  const updateStatusMutation = useUpdatePropertyStatus();

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

      // Invalidate and refetch pending properties
      queryClient.invalidateQueries({ queryKey: ["pending-properties"] });

      setSelectedProperty(null);
      setActionType(null);
      setRejectionReason("");
      onClose(); // Close the modal after successful action
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

  const closeActionDialog = () => {
    setSelectedProperty(null);
    setActionType(null);
    setRejectionReason("");
  };

  const nextImage = () => {
    if (!property) return;
    setCurrentImageIndex((prev) =>
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    if (!property) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  const formatPrice = (price: number, currency: string) => {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "DOLLARS" ? "USD" : "BOB",
    });
    return formatter.format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!property) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                {property.title}
              </div>
              <Badge
                variant="secondary"
                className="text-yellow-600 bg-yellow-50"
              >
                <Clock className="mr-1 h-3 w-3" />
                Pending Review
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Submitted {formatDate(property.createdAt)} by{" "}
              {property.agent.firstName} {property.agent.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Image Gallery */}
            {property.images.length > 0 && (
              <div className="relative aspect-video">
                <Image
                  src={property.images[currentImageIndex]}
                  alt={`${property.title} - Image ${currentImageIndex + 1}`}
                  fill
                  className="object-cover rounded-lg"
                />
                {property.images.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                      <Badge
                        variant="secondary"
                        className="bg-black/50 text-white"
                      >
                        {currentImageIndex + 1} / {property.images.length}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-4">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Property Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                        <Square className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {property.area.toLocaleString()} m²
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{property.propertyType}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Location */}
                    <div>
                      <h4 className="font-semibold mb-2">Location</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {property.address || "No address specified"}
                          </span>
                        </div>
                        <div className="ml-6">
                          {property.address}, {property.city}, {property.state}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Description */}
                    <div>
                      <h4 className="font-semibold mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                        {property.description}
                      </p>
                    </div>

                    {/* Features */}
                    {property.features && property.features.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-semibold mb-2">Features</h4>
                          <div className="flex flex-wrap gap-2">
                            {property.features
                              .slice(0, 6)
                              .map((feature, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {feature}
                                </Badge>
                              ))}
                            {property.features.length > 6 && (
                              <Badge variant="outline" className="text-xs">
                                +{property.features.length - 6} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Price Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-base">
                      <DollarSign className="h-4 w-4" />
                      Price
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {formatPrice(property.price, property.currency)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {property.transactionType}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Type:</span>
                        <span className="font-medium">
                          {property.propertyType}
                        </span>
                      </div>
                      {property.exchangeRate && (
                        <div className="flex justify-between text-sm">
                          <span>Exchange Rate:</span>
                          <span className="font-medium">
                            ${property.exchangeRate}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Agent Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-base">
                      <User className="h-4 w-4" />
                      Agent
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {property.agent.firstName?.[0]}
                          {property.agent.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">
                          {property.agent.firstName} {property.agent.lastName}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      {property.agent.phone && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{property.agent.phone}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => handleApprove(property.id)}
                      disabled={updateStatusMutation.isPending}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      size="sm"
                      onClick={() => handleReject(property.id)}
                      disabled={updateStatusMutation.isPending}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approval/Rejection Dialog */}
      <Dialog
        open={!!selectedProperty}
        onOpenChange={(open) => !open && closeActionDialog()}
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
              onClick={closeActionDialog}
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
    </>
  );
}
