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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Search,
  Edit,
  Eye,
  EyeOff,
  Building2,
  Phone,
  Mail,
  MapPin,
  Users,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// Types
interface Agency {
  id: string;
  name: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
  createdAt: string;
  _count?: {
    users: number;
    properties: number;
  };
}

// Form schemas
const createAgencySchema = z.object({
  name: z.string().min(2, "Agency name must be at least 2 characters"),
  address: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .optional(),
  phone: z.string().min(10, "Phone must be at least 10 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
});

type CreateAgencyFormData = z.infer<typeof createAgencySchema>;

export function AgencyManagement() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<CreateAgencyFormData>({
    resolver: zodResolver(createAgencySchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
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

      const response = await fetch("/api/agencies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          address: data.address || null,
          phone: data.phone || null,
          email: data.email || null,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Agency created successfully",
        });
        setIsCreateDialogOpen(false);
        form.reset();
        fetchAgencies();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to create agency");
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
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="+1234567890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="contact@agency.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <DialogFooter>
                      <Button type="submit" disabled={isCreating}>
                        {isCreating ? "Creating..." : "Create Agency"}
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

          {/* Agencies Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAgencies.length === 0 ? (
              <div className="col-span-full text-center py-8">
                No agencies found
              </div>
            ) : (
              filteredAgencies.map((agency) => (
                <Card
                  key={agency.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={agency.logoUrl || undefined} />
                          <AvatarFallback>
                            <Building2 className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {agency.name}
                          </CardTitle>
                          <Badge
                            variant={agency.active ? "default" : "secondary"}
                          >
                            {agency.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {agency.address && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {agency.address}
                        </div>
                      )}
                      {agency.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {agency.phone}
                        </div>
                      )}
                      {agency.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {agency.email}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-3 w-3" />
                          {agency._count?.users || 0} users
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="h-3 w-3" />
                          {agency._count?.properties || 0} properties
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleAgencyStatus(agency.id, agency.active)
                        }
                      >
                        {agency.active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
