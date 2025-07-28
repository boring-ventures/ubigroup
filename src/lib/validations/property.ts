import { z } from "zod";
import { PropertyType, TransactionType, PropertyStatus } from "@prisma/client";

export const createPropertySchema = z.object({
  title: z.string().min(1, "Property title is required").max(200),
  description: z.string().min(1, "Property description is required").max(2000),
  price: z.number().min(0, "Price must be a positive number"),
  propertyType: z.nativeEnum(PropertyType),
  transactionType: z.nativeEnum(TransactionType),
  address: z.string().min(1, "Address is required").max(500),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  bedrooms: z.number().int().min(0, "Bedrooms must be a non-negative integer"),
  bathrooms: z
    .number()
    .int()
    .min(0, "Bathrooms must be a non-negative integer"),
  area: z.number().min(0, "Area must be a positive number"),
  features: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([]),
  videos: z.array(z.string().url()).default([]),
});

export const updatePropertyStatusSchema = z.object({
  id: z.string().cuid(),
  status: z.nativeEnum(PropertyStatus),
  rejectionReason: z.string().optional(),
});

export const propertyQuerySchema = z.object({
  // Search and filter parameters
  search: z.string().optional(),
  status: z.nativeEnum(PropertyStatus).optional(),
  type: z.nativeEnum(PropertyType).optional(),
  transactionType: z.nativeEnum(TransactionType).optional(),

  // Location filters
  locationState: z.string().optional(),
  locationCity: z.string().optional(),
  locationNeigh: z.string().optional(),

  // Price range
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),

  // Property characteristics
  minBedrooms: z.number().int().min(0).optional(),
  maxBedrooms: z.number().int().min(0).optional(),
  minBathrooms: z.number().int().min(0).optional(),
  maxBathrooms: z.number().int().min(0).optional(),
  minSquareMeters: z.number().min(0).optional(),
  maxSquareMeters: z.number().min(0).optional(),

  // Features
  features: z.array(z.string()).optional(),

  // Admin filters
  agentId: z.string().optional(),
  agencyId: z.string().optional(),

  // Pagination and sorting
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z
    .enum(["createdAt", "updatedAt", "price", "title"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyStatusInput = z.infer<
  typeof updatePropertyStatusSchema
>;
export type PropertyQueryInput = z.infer<typeof propertyQuerySchema>;
