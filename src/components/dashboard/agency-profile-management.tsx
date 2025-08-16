"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  useAgencyProfile,
  useUpdateAgencyProfile,
} from "@/hooks/use-agency-profile";
import { Building2, MapPin, Phone, Save, Loader2 } from "lucide-react";
import { LogoUpload } from "./logo-upload";

const agencyProfileSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre de la agencia debe tener al menos 2 caracteres")
    .max(100),
  logoUrl: z.string().optional().or(z.literal("")),
  address: z
    .string()
    .min(10, "La dirección debe tener al menos 10 caracteres")
    .max(200)
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .min(10, "El teléfono debe tener al menos 10 caracteres")
    .max(20)
    .optional()
    .or(z.literal("")),
});

type AgencyProfileFormData = z.infer<typeof agencyProfileSchema>;

export function AgencyProfileManagement() {
  const { toast } = useToast();
  const { data: agency, isLoading, error } = useAgencyProfile();
  const updateAgencyProfile = useUpdateAgencyProfile();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<AgencyProfileFormData>({
    resolver: zodResolver(agencyProfileSchema),
    defaultValues: {
      name: "",
      logoUrl: "",
      address: "",
      phone: "",
    },
  });

  // Update form when agency data loads
  React.useEffect(() => {
    if (agency) {
      form.reset({
        name: agency.name,
        logoUrl: agency.logoUrl || "",
        address: agency.address || "",
        phone: agency.phone || "",
      });
    }
  }, [agency, form]);

  const onSubmit = async (data: AgencyProfileFormData) => {
    try {
      // Convert empty strings to null for optional fields
      const updateData = {
        name: data.name,
        logoUrl: data.logoUrl || null,
        address: data.address || null,
        phone: data.phone || null,
      };

      await updateAgencyProfile.mutateAsync(updateData);

      toast({
        title: "Éxito",
        description: "Perfil de agencia actualizado exitosamente",
      });

      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al actualizar el perfil de la agencia",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (agency) {
      form.reset({
        name: agency.name,
        logoUrl: agency.logoUrl || "",
        address: agency.address || "",
        phone: agency.phone || "",
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              Error loading agency profile
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "Failed to load agency information"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!agency) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No agency found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              No agency is associated with your account.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Agency Profile</CardTitle>
              <p className="text-muted-foreground">
                Manage your agency information and contact details
              </p>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            ) : (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={updateAgencyProfile.isPending}
                >
                  {updateAgencyProfile.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Agency Logo and Name */}
              <div className="flex items-start space-x-6">
                <div className="flex flex-col items-center space-y-2">
                  {isEditing ? (
                    <LogoUpload
                      agencyId={agency.id}
                      currentLogoUrl={agency.logoUrl}
                      onUploadComplete={(logoUrl) => {
                        form.setValue("logoUrl", logoUrl);
                      }}
                      onUploadError={(error) => {
                        toast({
                          title: "Error",
                          description: error.message,
                          variant: "destructive",
                        });
                      }}
                    />
                  ) : (
                    <Avatar className="h-24 w-24">
                      <AvatarImage
                        src={agency.logoUrl || ""}
                        alt={agency.name}
                      />
                      <AvatarFallback className="text-2xl">
                        {agency.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agency Name *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={!isEditing}
                            placeholder="Enter agency name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Phone className="mr-2 h-4 w-4" />
                        Phone Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isEditing}
                          placeholder="+55 11 9999-1234"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <MapPin className="mr-2 h-4 w-4" />
                      Address
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={!isEditing}
                        placeholder="Enter full agency address"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Agency Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Agency Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold">Active Since</div>
              <div className="text-sm text-muted-foreground">
                {new Date(agency.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">Status</div>
              <div className="text-sm text-muted-foreground">
                {agency.active ? "Active" : "Inactive"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">Last Updated</div>
              <div className="text-sm text-muted-foreground">
                {new Date(agency.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
