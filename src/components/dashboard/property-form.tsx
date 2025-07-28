"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Loader } from "@/components/ui/loader";
import { X, Plus } from "lucide-react";
import {
  createPropertySchema,
  type CreatePropertyInput,
} from "@/lib/validations/property";
import { PropertyType, TransactionType } from "@prisma/client";
import { useAuth } from "@/providers/auth-provider";
import { uploadFiles, validateFile } from "@/lib/upload";

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
  const { user, session, profile } = useAuth();

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
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>
          {propertyId ? "Edit Property" : "Create New Property"}
        </CardTitle>
        <CardDescription>
          {propertyId
            ? "Update your property listing details"
            : "Add a new property listing for approval"}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
            className="space-y-6"
          >
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Modern 2BR Apartment in Downtown"
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
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detailed description of the property..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select property type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={PropertyType.APARTMENT}>
                            Apartment
                          </SelectItem>
                          <SelectItem value={PropertyType.HOUSE}>
                            House
                          </SelectItem>
                          <SelectItem value={PropertyType.OFFICE}>
                            Office
                          </SelectItem>
                          <SelectItem value={PropertyType.LAND}>
                            Land
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
                      <FormLabel>Transaction Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select transaction type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={TransactionType.SALE}>
                            For Sale
                          </SelectItem>
                          <SelectItem value={TransactionType.RENT}>
                            For Rent
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="currency-bolivianos"
                      name="currency"
                      value={Currency.BOLIVIANOS}
                      checked={currency === Currency.BOLIVIANOS}
                      onChange={(e) => setCurrency(e.target.value as Currency)}
                      className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                    />
                    <Label htmlFor="currency-bolivianos">
                      Price in Bolivianos (Bs)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="currency-dollars"
                      name="currency"
                      value={Currency.DOLLARS}
                      checked={currency === Currency.DOLLARS}
                      onChange={(e) => setCurrency(e.target.value as Currency)}
                      className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                    />
                    <Label htmlFor="currency-dollars">
                      Price in US Dollars ($)
                    </Label>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            field.onChange(isNaN(value) ? undefined : value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the price in{" "}
                        {currency === Currency.BOLIVIANOS
                          ? "Bolivianos (Bs)"
                          : "US Dollars ($)"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {currency === Currency.DOLLARS && (
                  <FormField
                    control={form.control}
                    name="exchangeRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exchange Rate (Bs/$) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="6.96"
                            value={exchangeRate || ""}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              setExchangeRate(isNaN(value) ? undefined : value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Current exchange rate from US Dollars to Bolivianos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Location</h3>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 123 Main Street" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., New York" {...field} />
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
                      <FormLabel>State *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., NY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Property Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Property Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bedrooms *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="1"
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
                      <FormLabel>Bathrooms *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="1"
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
                      <FormLabel>Area (sq ft) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="1000"
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
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Features</h3>

              <div className="flex flex-wrap gap-2 mb-4">
                {features.map((feature) => (
                  <Badge
                    key={feature}
                    variant="secondary"
                    className="px-3 py-1"
                  >
                    {feature}
                    <button
                      type="button"
                      onClick={() => removeFeature(feature)}
                      className="ml-2 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add a feature (e.g., Swimming Pool, Garage)"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addFeature())
                  }
                />
                <Button type="button" onClick={addFeature} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Media Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Images and Videos</h3>

              {/* Images Section */}
              <div className="space-y-3">
                <h4 className="text-md font-medium">Images</h4>
                <p className="text-sm text-muted-foreground">
                  Maximum file size: 50MB per file
                </p>

                {/* Existing uploaded images */}
                {uploadedImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {uploadedImages.map((imageUrl, index) => (
                      <div
                        key={`uploaded-${index}`}
                        className="relative group border rounded-lg p-2 bg-muted"
                      >
                        <img
                          src={imageUrl}
                          alt={`Uploaded image ${index + 1}`}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeUploadedImage(index)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New image files */}
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {images.map((file, index) => (
                      <div
                        key={`new-${index}`}
                        className="relative group border rounded-lg p-2 bg-muted"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New image ${index + 1}`}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                  />
                </div>
              </div>

              {/* Videos Section */}
              <div className="space-y-3">
                <h4 className="text-md font-medium">Videos</h4>
                <p className="text-sm text-muted-foreground">
                  Maximum file size: 50MB per file
                </p>

                {/* Existing uploaded videos */}
                {uploadedVideos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {uploadedVideos.map((videoUrl, index) => (
                      <div
                        key={`uploaded-video-${index}`}
                        className="relative group border rounded-lg p-2 bg-muted"
                      >
                        <video
                          src={videoUrl}
                          className="w-20 h-20 object-cover rounded"
                          controls={false}
                          muted
                        />
                        <button
                          type="button"
                          onClick={() => removeUploadedVideo(index)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New video files */}
                {videos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {videos.map((file, index) => (
                      <div
                        key={`new-video-${index}`}
                        className="relative group border rounded-lg p-2 bg-muted"
                      >
                        <video
                          src={URL.createObjectURL(file)}
                          className="w-20 h-20 object-cover rounded"
                          controls={false}
                          muted
                        />
                        <button
                          type="button"
                          onClick={() => removeVideo(index)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={handleVideoUpload}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting && <Loader className="mr-2 h-4 w-4" />}
                {propertyId ? "Update Property" : "Create Property"}
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
