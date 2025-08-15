"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Search,
  Edit,
  Eye,
  EyeOff,
  Building2,
  Phone,
  Users,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  createAgencySchema,
  CreateAgencyInput,
} from "@/lib/validations/agency";

// Types
interface Agency {
  id: string;
  name: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  active: boolean;
  createdAt: string;
  _count?: {
    users: number;
    properties: number;
  };
}

type CreateAgencyFormData = CreateAgencyInput;

interface AgencyManagementProps {
  onAgencyUpdate?: () => void;
}

export function AgencyManagement({ onAgencyUpdate }: AgencyManagementProps) {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);

  const form = useForm<CreateAgencyFormData>({
    resolver: zodResolver(createAgencySchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
    },
  });

  const editForm = useForm<CreateAgencyFormData>({
    resolver: zodResolver(createAgencySchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
    },
  });

  // Fetch agencies
  const fetchAgencies = async () => {
    try {
      const response = await fetch("/api/agencies");
      if (response.ok) {
        const data = await response.json();
        setAgencies(data.agencies || []);
      }
    } catch (error) {
      console.error("Failed to fetch agencies:", error);
      toast({
        title: "Error",
        description: "Failed to fetch agencies",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchAgencies();
      setLoading(false);
    };
    loadData();
  }, []);

  // Create agency
  const onSubmit = async (data: CreateAgencyFormData) => {
    try {
      setIsCreating(true);

      const requestData = {
        name: data.name,
        address: data.address?.trim() || null,
        phone: data.phone?.trim() || null,
      };

      console.log("Submitting agency data:", requestData);

      const response = await fetch("/api/agencies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log("Success response:", result);
        toast({
          title: "Success",
          description: "Agency created successfully",
        });
        setIsCreateDialogOpen(false);
        form.reset();
        fetchAgencies();
        onAgencyUpdate?.();
      } else {
        const error = await response.json();
        console.log("Error response:", error);
        throw new Error(
          error.error || error.message || "Failed to create agency"
        );
      }
    } catch (error) {
      console.error("Failed to create agency:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create agency",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Edit agency
  const handleEditAgency = (agency: Agency) => {
    setEditingAgency(agency);
    editForm.reset({
      name: agency.name,
      address: agency.address || "",
      phone: agency.phone || "",
    });
    setIsEditDialogOpen(true);
  };

  const onEditSubmit = async (data: CreateAgencyFormData) => {
    if (!editingAgency) return;

    try {
      setIsEditing(true);

      const response = await fetch(`/api/agencies/${editingAgency.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          address: data.address?.trim() || null,
          phone: data.phone?.trim() || null,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Agency updated successfully",
        });
        setIsEditDialogOpen(false);
        setEditingAgency(null);
        editForm.reset();
        fetchAgencies();
        onAgencyUpdate?.();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to update agency");
      }
    } catch (error) {
      console.error("Failed to update agency:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update agency",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  // Toggle agency status
  const toggleAgencyStatus = async (
    agencyId: string,
    currentStatus: boolean
  ) => {
    try {
      const response = await fetch(`/api/agencies/${agencyId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active: !currentStatus }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Agency ${!currentStatus ? "activated" : "deactivated"} successfully`,
        });
        fetchAgencies();
        onAgencyUpdate?.();
      } else {
        throw new Error("Failed to update agency status");
      }
    } catch (error) {
      console.error("Failed to toggle agency status:", error);
      toast({
        title: "Error",
        description: "Failed to update agency status",
        variant: "destructive",
      });
    }
  };

  // Filter agencies
  const filteredAgencies = agencies.filter(
    (agency) =>
      agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agency.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center p-8">Loading agencies...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>System Agencies</CardTitle>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Agency
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Agency</DialogTitle>
                  <DialogDescription>
                    Create a new real estate agency in the system.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agency Name</FormLabel>
                          <FormControl>
                            <Input placeholder="ABC Real Estate" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="123 Main St, City, State"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="12345678"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="submit" disabled={isCreating}>
                        {isCreating ? "Creating..." : "Create Agency"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Edit Agency Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Edit Agency</DialogTitle>
                  <DialogDescription>
                    Update agency information and contact details.
                  </DialogDescription>
                </DialogHeader>
                <Form {...editForm}>
                  <form
                    onSubmit={editForm.handleSubmit(onEditSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={editForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agency Name</FormLabel>
                          <FormControl>
                            <Input placeholder="ABC Real Estate" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="123 Main St, City, State"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="12345678"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="submit" disabled={isEditing}>
                        {isEditing ? "Updating..." : "Update Agency"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Agencies Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agency</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Properties</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgencies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No agencies found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAgencies.map((agency) => (
                    <TableRow key={agency.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={agency.logoUrl || undefined} />
                            <AvatarFallback>
                              <Building2 className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{agency.name}</div>
                            {agency.address && (
                              <div className="text-sm text-muted-foreground">
                                {agency.address}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {agency.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3" />
                              {agency.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {agency._count?.users || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {agency._count?.properties || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={agency.active ? "default" : "secondary"}
                        >
                          {agency.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(agency.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleAgencyStatus(agency.id, agency.active)
                            }
                            title={
                              agency.active
                                ? "Deactivate agency"
                                : "Activate agency"
                            }
                          >
                            {agency.active ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAgency(agency)}
                            title="Edit agency"
                          >
                            <Edit className="h-4 w-4" />
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
  );
}
