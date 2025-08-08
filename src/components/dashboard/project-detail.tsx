"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  MapPin,
  Calendar,
  Users,
  Plus,
  Edit,
  Trash2,
  Layers,
  Grid3X3,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import Image from "next/image";
import {
  createFloorSchema,
  createQuadrantSchema,
} from "@/lib/validations/project";
import { PropertyType, Currency, QuadrantStatus } from "@prisma/client";

// Client-side only date formatter to prevent hydration errors
function ClientDateFormatter({ date }: { date: string }) {
  const [formattedDate, setFormattedDate] = useState<string>("");

  React.useEffect(() => {
    setFormattedDate(new Date(date).toLocaleDateString());
  }, [date]);

  return <span>{formattedDate}</span>;
}

// Client-side only wrapper to prevent hydration errors
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}

interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  propertyType: string;
  images: string[];
  createdAt: string;
  active: boolean;
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
  floors: {
    id: string;
    number: number;
    name: string | null;
    quadrants: {
      id: string;
      customId: string;
      area: number;
      bedrooms: number;
      bathrooms: number;
      price: number;
      currency: string;
      status: string;
      active: boolean;
    }[];
  }[];
}

interface ProjectDetailProps {
  project: Project;
}

export function ProjectDetail({ project }: ProjectDetailProps) {
  const [selectedFloor, setSelectedFloor] = useState<
    Project["floors"][0] | null
  >(null);
  const [showFloorDialog, setShowFloorDialog] = useState(false);
  const [showQuadrantDialog, setShowQuadrantDialog] = useState(false);
  const [selectedQuadrant, setSelectedQuadrant] = useState<any>(null);
  const queryClient = useQueryClient();

  const floorForm = useForm({
    resolver: zodResolver(createFloorSchema),
    defaultValues: {
      number: 1,
      name: "",
    },
  });

  const quadrantForm = useForm({
    resolver: zodResolver(createQuadrantSchema),
    defaultValues: {
      area: 0,
      bedrooms: 0,
      bathrooms: 0,
      price: 0,
      currency: Currency.BOLIVIANOS,
      status: QuadrantStatus.AVAILABLE,
      active: true,
    },
  });

  const createFloorMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/projects/${project.id}/floors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create floor");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowFloorDialog(false);
      floorForm.reset();
      toast({ title: "Success", description: "Floor created successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create floor",
        variant: "destructive",
      });
    },
  });

  const createQuadrantMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(
        `/api/floors/${selectedFloor?.id}/quadrants`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error("Failed to create quadrant");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowQuadrantDialog(false);
      quadrantForm.reset();
      toast({ title: "Success", description: "Quadrant created successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create quadrant",
        variant: "destructive",
      });
    },
  });

  const updateQuadrantMutation = useMutation({
    mutationFn: async ({
      quadrantId,
      data,
    }: {
      quadrantId: string;
      data: any;
    }) => {
      const response = await fetch(
        `/api/floors/${selectedFloor?.id}/quadrants`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quadrantId, ...data }),
        }
      );
      if (!response.ok) throw new Error("Failed to update quadrant");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowQuadrantDialog(false);
      setSelectedQuadrant(null);
      quadrantForm.reset();
      toast({ title: "Success", description: "Quadrant updated successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update quadrant",
        variant: "destructive",
      });
    },
  });

  const handleFloorSubmit = (data: any) => {
    createFloorMutation.mutate(data);
  };

  const handleQuadrantSubmit = (data: any) => {
    if (selectedQuadrant) {
      updateQuadrantMutation.mutate({ quadrantId: selectedQuadrant.id, data });
    } else {
      createQuadrantMutation.mutate(data);
    }
  };

  const handleQuadrantClick = (quadrant: any) => {
    setSelectedQuadrant(quadrant);
    quadrantForm.reset({
      area: quadrant.area,
      bedrooms: quadrant.bedrooms,
      bathrooms: quadrant.bathrooms,
      price: quadrant.price,
      currency: quadrant.currency,
      status: quadrant.status,
      active: quadrant.active,
    });
    setShowQuadrantDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-500";
      case "UNAVAILABLE":
        return "bg-red-500";
      case "RESERVED":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "UNAVAILABLE":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "RESERVED":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground flex items-center mt-2">
            <MapPin className="mr-1 h-4 w-4" />
            {project.location}
          </p>
        </div>
        <Badge variant={project.active ? "default" : "secondary"}>
          {project.active ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Project Images */}
      {project.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Project Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {project.images.map((image, index) => (
                <Image
                  key={index}
                  src={image}
                  alt={`Project image ${index + 1}`}
                  width={200}
                  height={150}
                  className="rounded-lg object-cover w-full h-32"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {project.description}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Property Type:</span>
              <Badge variant="outline">{project.propertyType}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Floors:</span>
              <span className="font-medium">{project.floors.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Quadrants:</span>
              <span className="font-medium">
                {project.floors.reduce(
                  (total, floor) => total + floor.quadrants.length,
                  0
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Created:</span>
              <span className="text-sm text-muted-foreground">
                <ClientDateFormatter date={project.createdAt} />
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agent Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              {project.agent.avatarUrl ? (
                <Image
                  src={project.agent.avatarUrl}
                  alt="Agent avatar"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
              )}
              <div>
                <p className="font-medium">
                  {project.agent.firstName} {project.agent.lastName}
                </p>
                <p className="text-sm text-muted-foreground">Agent</p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Agency</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {project.agency.name}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floors and Quadrants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Layers className="mr-2 h-5 w-5" />
              Floors & Quadrants
            </CardTitle>
            <ClientOnly>
              <Dialog open={showFloorDialog} onOpenChange={setShowFloorDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Floor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Floor</DialogTitle>
                    <DialogDescription>
                      Add a new floor to your project
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...floorForm}>
                    <form
                      onSubmit={floorForm.handleSubmit(handleFloorSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={floorForm.control}
                        name="number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Floor Number</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={floorForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Floor Name (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Ground Floor, First Floor"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowFloorDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createFloorMutation.isPending}
                        >
                          {createFloorMutation.isPending
                            ? "Creating..."
                            : "Create Floor"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </ClientOnly>
          </div>
        </CardHeader>
        <CardContent>
          {project.floors.length === 0 ? (
            <div className="text-center py-8">
              <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No floors yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first floor to start creating quadrants
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {project.floors.map((floor) => (
                <div key={floor.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Floor {floor.number}
                        {floor.name && ` - ${floor.name}`}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {floor.quadrants.length} quadrants
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedFloor(floor);
                        setSelectedQuadrant(null);
                        quadrantForm.reset();
                        setShowQuadrantDialog(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Quadrant
                    </Button>
                  </div>

                  {floor.quadrants.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-muted-foreground rounded-lg">
                      <Grid3X3 className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No quadrants yet
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {floor.quadrants.map((quadrant) => (
                        <div
                          key={quadrant.id}
                          className={`relative p-3 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(
                            quadrant.status
                          )} bg-opacity-10`}
                          onClick={() => {
                            setSelectedFloor(floor);
                            handleQuadrantClick(quadrant);
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium">
                              {quadrant.customId}
                            </span>
                            {getStatusIcon(quadrant.status)}
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>Area:</span>
                              <span>{quadrant.area}m²</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Bed:</span>
                              <span>{quadrant.bedrooms}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Bath:</span>
                              <span>{quadrant.bathrooms}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Price:</span>
                              <span>${quadrant.price.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quadrant Dialog */}
      <ClientOnly>
        <Dialog open={showQuadrantDialog} onOpenChange={setShowQuadrantDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedQuadrant ? "Edit Quadrant" : "Add New Quadrant"}
              </DialogTitle>
              <DialogDescription>
                {selectedQuadrant
                  ? "Update quadrant information"
                  : "Add a new quadrant to this floor"}
              </DialogDescription>
            </DialogHeader>
            <Form {...quadrantForm}>
              <form
                onSubmit={quadrantForm.handleSubmit(handleQuadrantSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={quadrantForm.control}
                    name="area"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Area (m²)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={quadrantForm.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bedrooms</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={quadrantForm.control}
                    name="bathrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bathrooms</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={quadrantForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={quadrantForm.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={Currency.BOLIVIANOS}>
                              Bolivianos
                            </SelectItem>
                            <SelectItem value={Currency.DOLLARS}>
                              Dollars
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={quadrantForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={QuadrantStatus.AVAILABLE}>
                              Available
                            </SelectItem>
                            <SelectItem value={QuadrantStatus.UNAVAILABLE}>
                              Unavailable
                            </SelectItem>
                            <SelectItem value={QuadrantStatus.RESERVED}>
                              Reserved
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowQuadrantDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createQuadrantMutation.isPending ||
                      updateQuadrantMutation.isPending
                    }
                  >
                    {createQuadrantMutation.isPending ||
                    updateQuadrantMutation.isPending
                      ? "Saving..."
                      : selectedQuadrant
                        ? "Update Quadrant"
                        : "Create Quadrant"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </ClientOnly>
    </div>
  );
}
