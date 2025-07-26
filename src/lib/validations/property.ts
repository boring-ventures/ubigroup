import * as z from "zod";
import { PropertyType, TransactionType, PropertyStatus } from "@prisma/client";

// Property creation schema
export const createPropertySchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description must be less than 1000 characters"),
  type: z.nativeEnum(PropertyType),
  locationState: z.string().min(2, "State is required"),
  locationCity: z.string().min(2, "City is required"),
  locationNeigh: z.string().min(2, "Neighborhood is required"),
  address: z.string().min(10, "Full address is required").optional(),
  price: z.number().positive("Price must be positive"),
  bedrooms: z.number().int().min(0, "Bedrooms cannot be negative"),
  bathrooms: z.number().int().min(0, "Bathrooms cannot be negative"),
  garageSpaces: z.number().int().min(0, "Garage spaces cannot be negative"),
  squareMeters: z.number().positive("Square meters must be positive"),
  transactionType: z.nativeEnum(TransactionType),
  images: z
    .array(z.string().url("Invalid image URL"))
    .min(1, "At least one image is required"),
  features: z.array(z.string()).default([]),
});

// Property update schema - all fields optional except id
export const updatePropertySchema = z.object({
  id: z.string().cuid("Invalid property ID"),
  title: z.string().min(5).max(100).optional(),
  description: z.string().min(20).max(1000).optional(),
  type: z.nativeEnum(PropertyType).optional(),
  locationState: z.string().min(2).optional(),
  locationCity: z.string().min(2).optional(),
  locationNeigh: z.string().min(2).optional(),
  address: z.string().min(10).optional(),
  price: z.number().positive().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  garageSpaces: z.number().int().min(0).optional(),
  squareMeters: z.number().positive().optional(),
  transactionType: z.nativeEnum(TransactionType).optional(),
  images: z.array(z.string().url()).min(1).optional(),
  features: z.array(z.string()).optional(),
});

// Property status update schema
export const updatePropertyStatusSchema = z.object({
  id: z.string().cuid("Invalid property ID"),
  status: z.nativeEnum(PropertyStatus),
  rejectionReason: z.string().optional(), // For rejection cases
});

// Property query filters schema
export const propertyQuerySchema = z.object({
  // Public filters
  status: z.nativeEnum(PropertyStatus).optional(),
  type: z.nativeEnum(PropertyType).optional(),
  transactionType: z.nativeEnum(TransactionType).optional(),
  locationState: z.string().optional(),
  locationCity: z.string().optional(),
  locationNeigh: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  minBedrooms: z.number().int().min(0).optional(),
  maxBedrooms: z.number().int().min(0).optional(),
  minBathrooms: z.number().int().min(0).optional(),
  maxBathrooms: z.number().int().min(0).optional(),
  minSquareMeters: z.number().positive().optional(),
  maxSquareMeters: z.number().positive().optional(),
  features: z.array(z.string()).optional(),
  search: z.string().optional(), // For text search in title/description

  // Admin filters
  agentId: z.string().cuid().optional(),
  agencyId: z.string().cuid().optional(),

  // Pagination
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),

  // Sorting
  sortBy: z
    .enum(["createdAt", "updatedAt", "price", "title"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Property ID parameter schema
export const propertyIdSchema = z.object({
  id: z.string().cuid("Invalid property ID"),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type UpdatePropertyStatusInput = z.infer<
  typeof updatePropertyStatusSchema
>;
export type PropertyQueryInput = z.infer<typeof propertyQuerySchema>;
export type PropertyIdInput = z.infer<typeof propertyIdSchema>;
