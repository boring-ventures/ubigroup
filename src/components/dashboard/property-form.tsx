"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  createPropertySchema,
  type CreatePropertyInput,
} from "@/lib/validations/property";
import { PropertyType, TransactionType } from "@prisma/client";
import {
  MapPin,
  Home,
  DollarSign,
  Image as ImageIcon,
  Video,
  X,
  Plus,
  CheckCircle,
  Circle,
  Ruler,
  Bed,
  Bath,
  Star,
} from "lucide-react";
import Image from "next/image";
import { uploadFiles, validateFile } from "@/lib/upload";
import { Loader } from "@/components/ui/loader";

// Define currency enum locally since it's not exported from Prisma client
enum Currency {
  BOLIVIANOS = "BOLIVIANOS",
  DOLLARS = "DOLLARS",
}

interface PropertyFormProps {
  initialData?: Partial<CreatePropertyInput>;
  propertyId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PropertyForm({
  initialData,
  propertyId,
  onSuccess,
  onCancel,
}: PropertyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [features, setFeatures] = useState<string[]>(
    initialData?.features || []
  );
  const [newFeature, setNewFeature] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>(
    initialData?.images || []
  );
  const [uploadedVideos, setUploadedVideos] = useState<string[]>(
    initialData?.videos || []
  );
  const [currency, setCurrency] = useState<Currency>(
    (initialData?.currency as Currency) || Currency.BOLIVIANOS
  );
  const [exchangeRate, setExchangeRate] = useState<number | undefined>(
    initialData?.exchangeRate
  );
  const {} = useAuth();

  const form = useForm<CreatePropertyInput>({
    resolver: zodResolver(createPropertySchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      price: initialData?.price || 0,
      currency: (initialData?.currency as Currency) || Currency.BOLIVIANOS,
      exchangeRate: initialData?.exchangeRate,
      propertyType: initialData?.propertyType || PropertyType.APARTMENT,
      transactionType: initialData?.transactionType || TransactionType.SALE,
      address: initialData?.address || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      municipality: initialData?.municipality || "",
      googleMapsUrl: initialData?.googleMapsUrl || "",
      latitude: initialData?.latitude || undefined,
      longitude: initialData?.longitude || undefined,
      bedrooms: initialData?.bedrooms || 1,
      bathrooms: initialData?.bathrooms || 1,
      area: initialData?.area || 0,
      features: initialData?.features || [],
      images: initialData?.images || [],
      videos: initialData?.videos || [],
    },
  });

  const addFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      const updatedFeatures = [...features, newFeature.trim()];
      setFeatures(updatedFeatures);
      form.setValue("features", updatedFeatures);
      setNewFeature("");
    }
  };

  const removeFeature = (feature: string) => {
    const updatedFeatures = features.filter((f) => f !== feature);
    setFeatures(updatedFeatures);
    form.setValue("features", updatedFeatures);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const validFiles = Array.from(files).filter((file) =>
        validateFile(file, "image")
      );
      setImages((prev) => [...prev, ...validFiles]);
    }
    // Clear the input so the same file can be selected again
    event.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const validFiles = Array.from(files).filter((file) =>
        validateFile(file, "video")
      );
      setVideos((prev) => [...prev, ...validFiles]);
    }
    // Clear the input so the same file can be selected again
    event.target.value = "";
  };

  const removeVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const removeUploadedVideo = (index: number) => {
    setUploadedVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: CreatePropertyInput) => {
    try {
      setIsSubmitting(true);
      console.log("Submitting property data:", data);

      // Upload new files if any
      let imageUrls = [...uploadedImages];
      let videoUrls = [...uploadedVideos];

      try {
        if (images.length > 0) {
          toast({
            title: "Uploading images...",
            description: "Please wait while images are being uploaded",
          });
          const uploadedImageUrls = await uploadFiles(images, "images");
          imageUrls = [...imageUrls, ...uploadedImageUrls];
        }

        if (videos.length > 0) {
          toast({
            title: "Uploading videos...",
            description: "Please wait while videos are being uploaded",
          });
          const uploadedVideoUrls = await uploadFiles(videos, "videos");
          videoUrls = [...videoUrls, ...uploadedVideoUrls];
        }
      } catch (uploadError) {
        console.error("Upload failed:", uploadError);
        toast({
          title: "Upload Failed",
          description:
            uploadError instanceof Error
              ? uploadError.message
              : "Failed to upload files",
          variant: "destructive",
        });
        return; // Stop the submission if upload fails
      }

      // Prepare form data with uploaded URLs
      const formData = {
        ...data,
        currency: currency,
        exchangeRate: currency === Currency.DOLLARS ? exchangeRate : undefined,
        images: imageUrls,
        videos: videoUrls,
      };

      const url = propertyId
        ? `/api/properties/${propertyId}`
        : "/api/properties";
      const method = propertyId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("API Error:", errorData);
        throw new Error(errorData.error || "Failed to save property");
      }

      const result = await response.json();
      console.log("Success response:", result);

      toast({
        title: "Success",
        description: propertyId
          ? "Property updated successfully"
          : "Property created successfully and sent for approval",
      });

      // Reset form and states
      if (!propertyId) {
        form.reset();
        setFeatures([]);
        setImages([]);
        setVideos([]);
        setUploadedImages([]);
        setUploadedVideos([]);
      }

      onSuccess?.();
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header with Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm text-gray-600">Información básica</span>
            </div>
            <div className="flex items-center space-x-2">
              <Circle className="h-5 w-5 text-gray-300" />
              <span className="text-sm text-gray-600">Ubicación</span>
            </div>
            <div className="flex items-center space-x-2">
              <Circle className="h-5 w-5 text-gray-300" />
              <span className="text-sm text-gray-600">Detalles</span>
            </div>
            <div className="flex items-center space-x-2">
              <Circle className="h-5 w-5 text-gray-300" />
              <span className="text-sm text-gray-600">Multimedia</span>
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(
            (data) => {
              console.log("Form validation passed, data:", data);
              onSubmit(data);
            },
            (errors) => {
              console.error("Form validation failed:", errors);
              toast({
                title: "Validation Error",
                description: "Please check all required fields",
                variant: "destructive",
              });
            }
          )}
          className="space-y-8"
        >
          {/* Section 1: Basic Information */}
          <Card className="border-2 border-blue-100 bg-blue-50/30">
            <CardHeader className="bg-blue-50 border-b border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Home className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-blue-900">
                    Información básica
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Cuéntanos sobre tu propiedad
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">
                      Título de la propiedad *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Departamento moderno de 2 dormitorios en el centro"
                        className="h-12 text-lg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">
                      Descripción *
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe tu propiedad en detalle. Incluye características clave, comodidades y qué hace especial a esta propiedad..."
                        rows={5}
                        className="text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        Tipo de propiedad *
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Selecciona el tipo de propiedad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={PropertyType.APARTMENT}>
                            🏢 Departamento
                          </SelectItem>
                          <SelectItem value={PropertyType.HOUSE}>
                            🏠 Casa
                          </SelectItem>
                          <SelectItem value={PropertyType.OFFICE}>
                            🏢 Oficina
                          </SelectItem>
                          <SelectItem value={PropertyType.LAND}>
                            🌱 Terreno
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="transactionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        Tipo de transacción *
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Selecciona el tipo de transacción" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={TransactionType.SALE}>
                            💰 En venta
                          </SelectItem>
                          <SelectItem value={TransactionType.RENT}>
                            📋 En alquiler
                          </SelectItem>
                          <SelectItem value={TransactionType.ANTICRÉTICO}>
                            🔄 Anticrético
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Pricing */}
          <Card className="border-2 border-green-100 bg-green-50/30">
            <CardHeader className="bg-green-50 border-b border-green-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-green-900">
                    Información de precios
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    Establece el precio de tu propiedad
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="bg-white p-6 rounded-lg border border-green-200">
                <h4 className="text-lg font-semibold mb-4 text-gray-800">
                  Selección de moneda
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-4 border-2 border-green-200 rounded-lg bg-green-50">
                    <input
                      type="radio"
                      id="currency-bolivianos"
                      name="currency"
                      value={Currency.BOLIVIANOS}
                      checked={currency === Currency.BOLIVIANOS}
                      onChange={(e) => setCurrency(e.target.value as Currency)}
                      className="h-5 w-5 text-green-600 border-green-300 focus:ring-green-500"
                    />
                    <Label
                      htmlFor="currency-bolivianos"
                      className="text-lg font-medium cursor-pointer"
                    >
                      🇧🇴 Bolivianos (Bs)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
                    <input
                      type="radio"
                      id="currency-dollars"
                      name="currency"
                      value={Currency.DOLLARS}
                      checked={currency === Currency.DOLLARS}
                      onChange={(e) => setCurrency(e.target.value as Currency)}
                      className="h-5 w-5 text-green-600 border-gray-300 focus:ring-green-500"
                    />
                    <Label
                      htmlFor="currency-dollars"
                      className="text-lg font-medium cursor-pointer"
                    >
                      🇺🇸 Dólares estadounidenses ($)
                    </Label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        Precio *
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                            {currency === Currency.BOLIVIANOS ? "Bs" : "$"}
                          </span>
                          <Input
                            type="number"
                            placeholder="0"
                            className="h-12 text-lg pl-12"
                            {...field}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              field.onChange(isNaN(value) ? undefined : value);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-sm">
                        Ingresa el precio en{" "}
                        {currency === Currency.BOLIVIANOS
                          ? "Bolivianos (Bs)"
                          : "Dólares estadounidenses ($)"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {currency === Currency.DOLLARS && (
                  <FormField
                    control={form.control}
                    name="exchangeRate"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">
                          Tipo de cambio (Bs/$) *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="6.96"
                            className="h-12 text-lg"
                            value={exchangeRate || ""}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              setExchangeRate(isNaN(value) ? undefined : value);
                            }}
                          />
                        </FormControl>
                        <FormDescription className="text-sm">
                          Tipo de cambio actual de dólares a bolivianos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Location */}
          <Card className="border-2 border-purple-100 bg-purple-50/30">
            <CardHeader className="bg-purple-50 border-b border-purple-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MapPin className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-purple-900">
                    Detalles de ubicación
                  </CardTitle>
                  <CardDescription className="text-purple-700">
                    ¿Dónde está ubicada tu propiedad?
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">
                      Dirección *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Calle Principal 123, Centro"
                        className="h-12 text-lg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        Ciudad *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: La Paz"
                          className="h-12 text-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        Estado/Departamento *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: La Paz"
                          className="h-12 text-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="municipality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        Municipio *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Centro"
                          className="h-12 text-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-white p-6 rounded-lg border border-purple-200">
                <h4 className="text-lg font-semibold mb-4 text-gray-800">
                  📍 Ubicación en mapa (opcional)
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Agrega coordenadas para mostrar tu propiedad en el mapa
                </p>

                <FormField
                  control={form.control}
                  name="googleMapsUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        URL de Google Maps
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://maps.google.com/..."
                          className="h-12 text-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-sm">
                        Pega la URL de Google Maps para esta ubicación
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">
                          Latitud
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="40.7128"
                            className="h-12 text-lg"
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              field.onChange(isNaN(value) ? undefined : value);
                            }}
                          />
                        </FormControl>
                        <FormDescription className="text-sm">
                          Coordenada de latitud para el pin del mapa
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">
                          Longitud
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="-74.0060"
                            className="h-12 text-lg"
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              field.onChange(isNaN(value) ? undefined : value);
                            }}
                          />
                        </FormControl>
                        <FormDescription className="text-sm">
                          Coordenada de longitud para el pin del mapa
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Property Details */}
          <Card className="border-2 border-orange-100 bg-orange-50/30">
            <CardHeader className="bg-orange-50 border-b border-orange-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Ruler className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-orange-900">
                    Detalles de la propiedad
                  </CardTitle>
                  <CardDescription className="text-orange-700">
                    Especificaciones clave de tu propiedad
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold flex items-center space-x-2">
                        <Bed className="h-5 w-5" />
                        <span>Dormitorios *</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="1"
                          className="h-12 text-lg"
                          {...field}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            field.onChange(isNaN(value) ? undefined : value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold flex items-center space-x-2">
                        <Bath className="h-5 w-5" />
                        <span>Baños *</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="1"
                          className="h-12 text-lg"
                          {...field}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            field.onChange(isNaN(value) ? undefined : value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold flex items-center space-x-2">
                        <Ruler className="h-5 w-5" />
                        <span>Área (m²) *</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="1000"
                          className="h-12 text-lg"
                          {...field}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            field.onChange(isNaN(value) ? undefined : value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Features */}
          <Card className="border-2 border-yellow-100 bg-yellow-50/30">
            <CardHeader className="bg-yellow-50 border-b border-yellow-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-yellow-900">
                    Características y amenidades
                  </CardTitle>
                  <CardDescription className="text-yellow-700">
                    ¿Qué hace especial tu propiedad?
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="bg-white p-6 rounded-lg border border-yellow-200">
                <h4 className="text-lg font-semibold mb-4 text-gray-800">
                  Características actuales
                </h4>
                <div className="flex flex-wrap gap-3 mb-6">
                  {features.length === 0 ? (
                    <p className="text-gray-500 italic">
                      Aún no se agregaron características
                    </p>
                  ) : (
                    features.map((feature) => (
                      <Badge
                        key={feature}
                        variant="secondary"
                        className="px-4 py-2 text-sm bg-yellow-100 text-yellow-800 border-yellow-200"
                      >
                        {feature}
                        <button
                          type="button"
                          onClick={() => removeFeature(feature)}
                          className="ml-2 text-yellow-600 hover:text-yellow-800 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>

                <div className="flex gap-3">
                  <Input
                    placeholder="Agrega una característica (ej.: Piscina, Garaje, Balcón)"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addFeature())
                    }
                    className="flex-1 h-12 text-lg"
                  />
                  <Button
                    type="button"
                    onClick={addFeature}
                    variant="outline"
                    className="h-12 px-6 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 6: Media Upload */}
          <Card className="border-2 border-indigo-100 bg-indigo-50/30">
            <CardHeader className="bg-indigo-50 border-b border-indigo-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <ImageIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-indigo-900">
                    Imágenes y videos
                  </CardTitle>
                  <CardDescription className="text-indigo-700">
                    Muestra tu propiedad de la mejor manera
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              {/* Images Section */}
              <div className="bg-white p-6 rounded-lg border border-indigo-200">
                <div className="flex items-center space-x-2 mb-4">
                  <ImageIcon className="h-5 w-5 text-indigo-600" />
                  <h4 className="text-lg font-semibold text-gray-800">
                    Imágenes
                  </h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Tamaño máximo por archivo: 50MB. Formatos soportados: JPG,
                  PNG, GIF
                </p>

                {/* Existing uploaded images */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                    {uploadedImages.map((imageUrl, index) => (
                      <div
                        key={`uploaded-${index}`}
                        className="relative group border-2 border-gray-200 rounded-lg p-2 bg-gray-50 hover:border-indigo-300 transition-colors"
                      >
                        <Image
                          src={imageUrl}
                          alt={`Imagen subida ${index + 1}`}
                          fill
                          className="object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeUploadedImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New image files */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                    {images.map((file, index) => (
                      <div
                        key={`new-${index}`}
                        className="relative group border-2 border-indigo-200 rounded-lg p-2 bg-indigo-50 hover:border-indigo-300 transition-colors"
                      >
                        <Image
                          src={URL.createObjectURL(file)}
                          alt={`Imagen nueva ${index + 1}`}
                          fill
                          className="object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="flex-1 h-12 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
                  />
                </div>
              </div>

              {/* Videos Section */}
              <div className="bg-white p-6 rounded-lg border border-indigo-200">
                <div className="flex items-center space-x-2 mb-4">
                  <Video className="h-5 w-5 text-indigo-600" />
                  <h4 className="text-lg font-semibold text-gray-800">
                    Videos
                  </h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Tamaño máximo por archivo: 50MB. Formatos soportados: MP4,
                  AVI, MOV
                </p>

                {/* Existing uploaded videos */}
                {uploadedVideos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                    {uploadedVideos.map((videoUrl, index) => (
                      <div
                        key={`uploaded-video-${index}`}
                        className="relative group border-2 border-gray-200 rounded-lg p-2 bg-gray-50 hover:border-indigo-300 transition-colors"
                      >
                        <video
                          src={videoUrl}
                          className="w-full h-24 object-cover rounded"
                          controls={false}
                          muted
                        />
                        <button
                          type="button"
                          onClick={() => removeUploadedVideo(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New video files */}
                {videos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                    {videos.map((file, index) => (
                      <div
                        key={`new-video-${index}`}
                        className="relative group border-2 border-indigo-200 rounded-lg p-2 bg-indigo-50 hover:border-indigo-300 transition-colors"
                      >
                        <video
                          src={URL.createObjectURL(file)}
                          className="w-full h-24 object-cover rounded"
                          controls={false}
                          muted
                        />
                        <button
                          type="button"
                          onClick={() => removeVideo(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <Input
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={handleVideoUpload}
                    className="flex-1 h-12 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-lg">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isSubmitting && (
                  <Loader className="mr-3 h-5 w-5 animate-spin" />
                )}
                {propertyId ? "Actualizar propiedad" : "Crear propiedad"}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="h-14 px-8 text-lg font-semibold border-2 border-gray-300 hover:bg-gray-50"
                >
                  Cancelar
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-4 text-center">
              {propertyId
                ? "Tus cambios se guardarán inmediatamente"
                : "Tu propiedad se enviará para aprobación después de crearla"}
            </p>
          </div>
        </form>
      </Form>
    </div>
  );
}
