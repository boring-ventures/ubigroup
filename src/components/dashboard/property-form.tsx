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
            title: "Subiendo videos...",
            description: "Por favor espera mientras se suben los videos",
          });
          const uploadedVideoUrls = await uploadFiles(videos, "videos");
          videoUrls = [...videoUrls, ...uploadedVideoUrls];
        }
      } catch (uploadError) {
        console.error("Upload failed:", uploadError);
        toast({
          title: "Error de Subida",
          description:
            uploadError instanceof Error
              ? uploadError.message
              : "Error al subir archivos",
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
        throw new Error(errorData.error || "Error al guardar la propiedad");
      }

      const result = await response.json();
      console.log("Success response:", result);

      toast({
        title: "Éxito",
        description: propertyId
          ? "Propiedad actualizada exitosamente"
          : "Propiedad creada exitosamente y enviada para aprobación",
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
            : "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6">
      {/* Header with Progress Steps */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 dark:text-green-400" />
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Información básica
              </span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Circle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 dark:text-gray-600" />
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Ubicación
              </span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Circle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 dark:text-gray-600" />
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Detalles
              </span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Circle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 dark:text-gray-600" />
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Multimedia
              </span>
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
                title: "Error de Validación",
                description: "Por favor verifica todos los campos requeridos",
                variant: "destructive",
              });
            }
          )}
          className="space-y-6 sm:space-y-8"
        >
          {/* Section 1: Basic Information */}
          <Card className="border-2 border-blue-100 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/30">
            <CardHeader className="bg-blue-50 dark:bg-blue-950/50 border-b border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Home className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl text-blue-900 dark:text-blue-100">
                    Información básica
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-blue-700 dark:text-blue-300">
                    Cuéntanos sobre tu propiedad
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 space-y-4 sm:space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base font-semibold">
                      Título de la propiedad *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Departamento moderno de 2 dormitorios en el centro"
                        className="h-10 sm:h-12 text-base sm:text-lg"
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
                    <FormLabel className="text-sm sm:text-base font-semibold">
                      Descripción *
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe tu propiedad en detalle. Incluye características clave, comodidades y qué hace especial a esta propiedad..."
                        rows={4}
                        className="text-sm sm:text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base font-semibold">
                        Tipo de propiedad *
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base">
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
                      <FormLabel className="text-sm sm:text-base font-semibold">
                        Tipo de transacción *
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base">
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
          <Card className="border-2 border-green-100 dark:border-green-800 bg-green-50/30 dark:bg-green-950/30">
            <CardHeader className="bg-green-50 dark:bg-green-950/50 border-b border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl text-green-900 dark:text-green-100">
                    Información de precios
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-green-700 dark:text-green-300">
                    Establece el precio de tu propiedad
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 space-y-4 sm:space-y-6">
              <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border border-green-200 dark:border-green-700">
                <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800 dark:text-gray-200">
                  Selección de moneda
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                  <div className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 border-2 border-green-200 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-950/50">
                    <input
                      type="radio"
                      id="currency-bolivianos"
                      name="currency"
                      value={Currency.BOLIVIANOS}
                      checked={currency === Currency.BOLIVIANOS}
                      onChange={(e) => setCurrency(e.target.value as Currency)}
                      className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 border-green-300 focus:ring-green-500"
                    />
                    <Label
                      htmlFor="currency-bolivianos"
                      className="text-sm sm:text-lg font-medium cursor-pointer"
                    >
                      🇧🇴 Bolivianos (Bs)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <input
                      type="radio"
                      id="currency-dollars"
                      name="currency"
                      value={Currency.DOLLARS}
                      checked={currency === Currency.DOLLARS}
                      onChange={(e) => setCurrency(e.target.value as Currency)}
                      className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 border-gray-300 dark:border-gray-600 focus:ring-green-500"
                    />
                    <Label
                      htmlFor="currency-dollars"
                      className="text-sm sm:text-lg font-medium cursor-pointer"
                    >
                      🇺🇸 Dólares estadounidenses ($)
                    </Label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base font-semibold">
                        Precio *
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-base sm:text-lg">
                            {currency === Currency.BOLIVIANOS ? "Bs" : "$"}
                          </span>
                          <Input
                            type="number"
                            placeholder="0"
                            className="h-10 sm:h-12 text-base sm:text-lg pl-10 sm:pl-12"
                            {...field}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              field.onChange(isNaN(value) ? undefined : value);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs sm:text-sm">
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
                        <FormLabel className="text-sm sm:text-base font-semibold">
                          Tipo de cambio (Bs/$) *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="6.96"
                            className="h-10 sm:h-12 text-base sm:text-lg"
                            value={exchangeRate || ""}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              setExchangeRate(isNaN(value) ? undefined : value);
                            }}
                          />
                        </FormControl>
                        <FormDescription className="text-xs sm:text-sm">
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
          <Card className="border-2 border-purple-100 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-950/30">
            <CardHeader className="bg-purple-50 dark:bg-purple-950/50 border-b border-purple-200 dark:border-purple-800">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl text-purple-900 dark:text-purple-100">
                    Detalles de ubicación
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-purple-700 dark:text-purple-300">
                    ¿Dónde está ubicada tu propiedad?
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 space-y-4 sm:space-y-6">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base font-semibold">
                      Dirección *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Calle Principal 123, Centro"
                        className="h-10 sm:h-12 text-base sm:text-lg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base font-semibold">
                        Ciudad *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: La Paz"
                          className="h-10 sm:h-12 text-base sm:text-lg"
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
                      <FormLabel className="text-sm sm:text-base font-semibold">
                        Estado/Departamento *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: La Paz"
                          className="h-10 sm:h-12 text-base sm:text-lg"
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
                      <FormLabel className="text-sm sm:text-base font-semibold">
                        Municipio *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Centro"
                          className="h-10 sm:h-12 text-base sm:text-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-purple-200 dark:border-purple-700">
                <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                  📍 Ubicación en mapa (opcional)
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
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
          <Card className="border-2 border-orange-100 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-950/30">
            <CardHeader className="bg-orange-50 dark:bg-orange-950/50 border-b border-orange-200 dark:border-orange-800">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Ruler className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl text-orange-900 dark:text-orange-100">
                    Detalles de la propiedad
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-orange-700 dark:text-orange-300">
                    Especificaciones clave de tu propiedad
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base font-semibold flex items-center space-x-1 sm:space-x-2">
                        <Bed className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>Dormitorios *</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="1"
                          className="h-10 sm:h-12 text-base sm:text-lg"
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
                      <FormLabel className="text-sm sm:text-base font-semibold flex items-center space-x-1 sm:space-x-2">
                        <Bath className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>Baños *</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="1"
                          className="h-10 sm:h-12 text-base sm:text-lg"
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
                      <FormLabel className="text-sm sm:text-base font-semibold flex items-center space-x-1 sm:space-x-2">
                        <Ruler className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>Área (m²) *</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="1000"
                          className="h-10 sm:h-12 text-base sm:text-lg"
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
          <Card className="border-2 border-yellow-100 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-950/30">
            <CardHeader className="bg-yellow-50 dark:bg-yellow-950/50 border-b border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <CardTitle className="text-xl text-yellow-900 dark:text-yellow-100">
                    Características y amenidades
                  </CardTitle>
                  <CardDescription className="text-yellow-700 dark:text-yellow-300">
                    ¿Qué hace especial tu propiedad?
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-yellow-200 dark:border-yellow-700">
                <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                  Características actuales
                </h4>
                <div className="flex flex-wrap gap-3 mb-6">
                  {features.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 italic">
                      Aún no se agregaron características
                    </p>
                  ) : (
                    features.map((feature) => (
                      <Badge
                        key={feature}
                        variant="secondary"
                        className="px-4 py-2 text-sm bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700"
                      >
                        {feature}
                        <button
                          type="button"
                          onClick={() => removeFeature(feature)}
                          className="ml-2 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 transition-colors"
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
                    className="h-12 px-6 border-yellow-300 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-950/50"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 6: Media Upload */}
          <Card className="border-2 border-indigo-100 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/30">
            <CardHeader className="bg-indigo-50 dark:bg-indigo-950/50 border-b border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                  <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl text-indigo-900 dark:text-indigo-100">
                    Imágenes y videos
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-indigo-700 dark:text-indigo-300">
                    Muestra tu propiedad de la mejor manera
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 space-y-6 sm:space-y-8">
              {/* Images Section */}
              <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border border-indigo-200 dark:border-indigo-700">
                <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                  <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Imágenes
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                  Tamaño máximo por archivo: 50MB. Formatos soportados: JPG,
                  PNG, GIF
                </p>

                {/* Existing uploaded images */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    {uploadedImages.map((imageUrl, index) => (
                      <div
                        key={`uploaded-${index}`}
                        className="relative group border-2 border-gray-200 dark:border-gray-600 rounded-lg p-2 bg-gray-50 dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors"
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    {images.map((file, index) => (
                      <div
                        key={`new-${index}`}
                        className="relative group border-2 border-indigo-200 dark:border-indigo-600 rounded-lg p-2 bg-indigo-50 dark:bg-indigo-950/50 hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors"
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

                <div className="flex gap-2 sm:gap-3">
                  <Input
                    type="file"
                    accept="image/*,.webp"
                    multiple
                    onChange={handleImageUpload}
                    className="flex-1 h-10 sm:h-12 text-sm sm:text-base file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
                  />
                </div>
              </div>

              {/* Videos Section */}
              <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border border-indigo-200 dark:border-indigo-700">
                <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                  <Video className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Videos
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                  Tamaño máximo por archivo: 50MB. Formatos soportados: MP4,
                  AVI, MOV, WebM. Se recomienda WebM para mejor compresión.
                </p>

                {/* Existing uploaded videos */}
                {uploadedVideos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    {uploadedVideos.map((videoUrl, index) => (
                      <div
                        key={`uploaded-video-${index}`}
                        className="relative group border-2 border-gray-200 dark:border-gray-600 rounded-lg p-2 bg-gray-50 dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors"
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    {videos.map((file, index) => (
                      <div
                        key={`new-video-${index}`}
                        className="relative group border-2 border-indigo-200 dark:border-indigo-600 rounded-lg p-2 bg-indigo-50 dark:bg-indigo-950/50 hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors"
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

                <div className="flex gap-2 sm:gap-3">
                  <Input
                    type="file"
                    accept="video/*,.webm"
                    multiple
                    onChange={handleVideoUpload}
                    className="flex-1 h-10 sm:h-12 text-sm sm:text-base file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isSubmitting && (
                  <Loader className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                )}
                {propertyId ? "Actualizar propiedad" : "Crear propiedad"}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </Button>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-3 sm:mt-4 text-center">
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
