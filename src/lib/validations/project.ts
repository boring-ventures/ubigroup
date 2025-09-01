import { z } from "zod";
import { Currency, QuadrantStatus, QuadrantType } from "@prisma/client";

// Project validation schema
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre del proyecto es requerido")
    .max(100, "El nombre del proyecto debe tener menos de 100 caracteres"),
  description: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(2000, "La descripción debe tener menos de 2000 caracteres"),
  location: z
    .string()
    .min(1, "La dirección es requerida")
    .max(200, "La dirección debe tener menos de 200 caracteres"),

  images: z
    .array(z.string().url("URL de imagen inválida"))
    .optional()
    .default([]),
  // Treat empty string as undefined to avoid URL validation error when optional field is left blank
  brochureUrl: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().url("URL de brochure inválida").optional()
  ),
  googleMapsUrl: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().url("URL de Google Maps inválida").optional()
  ),
  // Be tolerant to empty strings coming from forms; coerce to number when string provided
  latitude: z.preprocess(
    (val) =>
      val === "" || val == null
        ? undefined
        : typeof val === "string"
          ? parseFloat(val)
          : val,
    z.number().optional()
  ),
  longitude: z.preprocess(
    (val) =>
      val === "" || val == null
        ? undefined
        : typeof val === "string"
          ? parseFloat(val)
          : val,
    z.number().optional()
  ),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// Floor validation schema
export const createFloorSchema = z.object({
  number: z.number().int().min(1, "El número de piso debe ser al menos 1"),
  name: z
    .string()
    .max(50, "El nombre del piso debe tener menos de 50 caracteres")
    .optional(),
});

export const updateFloorSchema = createFloorSchema.partial();

export type CreateFloorInput = z.infer<typeof createFloorSchema>;
export type UpdateFloorInput = z.infer<typeof updateFloorSchema>;

// Quadrant validation schema
export const createQuadrantSchema = z.object({
  customId: z
    .string()
    .min(1, "El nombre es requerido")
    .max(50, "El nombre debe tener menos de 50 caracteres"),
  type: z
    .nativeEnum(QuadrantType, {
      errorMap: () => ({
        message: "Por favor selecciona un tipo de cuadrante válido",
      }),
    })
    .default(QuadrantType.DEPARTAMENTO),
  area: z.number().positive("El área debe ser positiva"),
  bedrooms: z.number().int().min(0, "Los dormitorios deben ser 0 o más"),
  bathrooms: z.number().int().min(0, "Los baños deben ser 0 o más"),
  price: z.number().positive("El precio debe ser positivo"),
  currency: z.nativeEnum(Currency, {
    errorMap: () => ({ message: "Por favor selecciona una moneda válida" }),
  }),
  exchangeRate: z
    .number()
    .positive("El tipo de cambio debe ser positivo")
    .optional(),
  status: z
    .nativeEnum(QuadrantStatus, {
      errorMap: () => ({ message: "Por favor selecciona un estado válido" }),
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
