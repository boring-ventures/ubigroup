import { z } from "zod";

export const createLandingImageSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().max(500, "Description too long").optional(),
  imageUrl: z.string().url("Invalid image URL"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("INACTIVE"),
});

export const updateLandingImageSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title too long")
    .optional(),
  description: z.string().max(500, "Description too long").optional(),
  imageUrl: z.string().url("Invalid image URL").optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export type CreateLandingImageInput = z.infer<typeof createLandingImageSchema>;
export type UpdateLandingImageInput = z.infer<typeof updateLandingImageSchema>;
