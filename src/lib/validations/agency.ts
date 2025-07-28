import * as z from "zod";

// Agency creation schema
export const createAgencySchema = z.object({
  name: z
    .string()
    .min(2, "Agency name must be at least 2 characters")
    .max(100, "Agency name must be less than 100 characters"),
  logoUrl: z.string().url("Invalid logo URL").optional(),
  address: z
    .union([
      z
        .string()
        .min(5, "Address must be at least 5 characters")
        .max(200, "Address must be less than 200 characters"),
      z.literal(""),
      z.null(),
    ])
    .optional(),
  phone: z
    .union([
      z
        .string()
        .min(8, "Phone must be at least 8 digits")
        .max(15, "Phone must be less than 15 digits")
        .regex(/^\d+$/, "Phone must contain only numbers"),
      z.literal(""),
      z.null(),
    ])
    .optional(),
});

// Agency update schema
export const updateAgencySchema = z.object({
  id: z.string().cuid("Invalid agency ID"),
  name: z.string().min(2).max(100).optional(),
  logoUrl: z.string().url("Invalid logo URL").optional(),
  address: z
    .union([
      z
        .string()
        .min(5, "Address must be at least 5 characters")
        .max(200, "Address must be less than 200 characters"),
      z.literal(""),
      z.null(),
    ])
    .optional(),
  phone: z
    .union([
      z
        .string()
        .min(8, "Phone must be at least 8 digits")
        .max(15, "Phone must be less than 15 digits")
        .regex(/^\d+$/, "Phone must contain only numbers"),
      z.literal(""),
      z.null(),
    ])
    .optional(),
  active: z.boolean().optional(),
});

// Agency ID parameter schema
export const agencyIdSchema = z.object({
  id: z.string().cuid("Invalid agency ID"),
});

// Agency query filters schema
export const agencyQuerySchema = z.object({
  search: z.string().optional(), // For text search in name
  active: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(["createdAt", "updatedAt", "name"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateAgencyInput = z.infer<typeof createAgencySchema>;
export type UpdateAgencyInput = z.infer<typeof updateAgencySchema>;
export type AgencyIdInput = z.infer<typeof agencyIdSchema>;
export type AgencyQueryInput = z.infer<typeof agencyQuerySchema>;
