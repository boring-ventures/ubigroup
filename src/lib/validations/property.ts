import { z } from "zod";
import { PropertyType, TransactionType, PropertyStatus } from "@prisma/client";

export const createPropertySchema = z.object({
  title: z.string().min(1, "Property title is required").max(200),
  description: z.string().min(1, "Property description is required").max(2000),
  price: z.number().min(0, "Price must be a positive number"),
  currency: z.enum(["BOLIVIANOS", "DOLLARS"]).default("BOLIVIANOS"),
  exchangeRate: z
    .number()
    .min(0, "Exchange rate must be a positive number")
    .optional(),
  propertyType: z.nativeEnum(PropertyType),
  transactionType: z.nativeEnum(TransactionType),
  address: z.string().min(1, "Address is required").max(500),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  municipality: z.string().min(1, "Municipality is required").max(100),
  googleMapsUrl: z
    .string()
    .url("Please enter a valid Google Maps URL")
    .optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
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
  status: z
    .string()
    .optional()
    .transform((val) => {
      if (val === "APPROVED") return "APPROVED" as const;
      if (val === "PENDING") return "PENDING" as const;
      if (val === "REJECTED") return "REJECTED" as const;
      return undefined;
    }),
  type: z
    .string()
    .optional()
    .transform((val) => {
      if (val === "HOUSE") return "HOUSE" as const;
      if (val === "APARTMENT") return "APARTMENT" as const;
      if (val === "OFFICE") return "OFFICE" as const;
      if (val === "LAND") return "LAND" as const;
      return undefined;
    }),
  transactionType: z
    .string()
    .optional()
    .transform((val) => {
      if (val === "SALE") return "SALE" as const;
      if (val === "RENT") return "RENT" as const;
      return undefined;
    }),

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
