import { z } from "zod";
import { PropertyType, Currency, QuadrantStatus } from "@prisma/client";

// Project validation schema
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters"),
  location: z
    .string()
    .min(1, "Location is required")
    .max(200, "Location must be less than 200 characters"),
  propertyType: z.nativeEnum(PropertyType, {
    errorMap: () => ({ message: "Please select a valid property type" }),
  }),
  images: z.array(z.string().url("Invalid image URL")).optional().default([]),
  googleMapsUrl: z.string().url("Invalid Google Maps URL").optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// Floor validation schema
export const createFloorSchema = z.object({
  number: z.number().int().min(1, "Floor number must be at least 1"),
  name: z
    .string()
    .max(50, "Floor name must be less than 50 characters")
    .optional(),
});

export const updateFloorSchema = createFloorSchema.partial();

export type CreateFloorInput = z.infer<typeof createFloorSchema>;
export type UpdateFloorInput = z.infer<typeof updateFloorSchema>;

// Quadrant validation schema
export const createQuadrantSchema = z.object({
  area: z.number().positive("Area must be positive"),
  bedrooms: z.number().int().min(0, "Bedrooms must be 0 or more"),
  bathrooms: z.number().int().min(0, "Bathrooms must be 0 or more"),
  price: z.number().positive("Price must be positive"),
  currency: z.nativeEnum(Currency, {
    errorMap: () => ({ message: "Please select a valid currency" }),
  }),
  exchangeRate: z
    .number()
    .positive("Exchange rate must be positive")
    .optional(),
  status: z
    .nativeEnum(QuadrantStatus, {
      errorMap: () => ({ message: "Please select a valid status" }),
    })
    .optional()
    .default(QuadrantStatus.AVAILABLE),
  active: z.boolean().optional().default(true),
});

export const updateQuadrantSchema = createQuadrantSchema.partial();

export type CreateQuadrantInput = z.infer<typeof createQuadrantSchema>;
export type UpdateQuadrantInput = z.infer<typeof updateQuadrantSchema>;

// Project with floors and quadrants validation schema
export const createProjectWithFloorsSchema = z.object({
  project: createProjectSchema,
  floors: z.array(
    z.object({
      floor: createFloorSchema,
      quadrants: z.array(createQuadrantSchema),
    })
  ),
});

export type CreateProjectWithFloorsInput = z.infer<
  typeof createProjectWithFloorsSchema
>;
