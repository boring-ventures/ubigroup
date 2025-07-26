import * as z from "zod";
import { UserRole } from "@prisma/client";

// User creation schema
export const createUserSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must be less than 100 characters"),
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must be less than 50 characters"),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must be less than 50 characters"),
    role: z.nativeEnum(UserRole),
    phone: z
      .string()
      .min(10, "Phone must be at least 10 characters")
      .max(20, "Phone must be less than 20 characters")
      .optional(),
    whatsapp: z
      .string()
      .min(10, "WhatsApp must be at least 10 characters")
      .max(20, "WhatsApp must be less than 20 characters")
      .optional(),
    agencyId: z.string().cuid("Invalid agency ID").optional(),
  })
  .refine(
    (data) => {
      // Super Admins should not have an agency
      if (data.role === UserRole.SUPER_ADMIN && data.agencyId) {
        return false;
      }
      // Agency Admins and Agents must have an agency
      if (
        (data.role === UserRole.AGENCY_ADMIN || data.role === UserRole.AGENT) &&
        !data.agencyId
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Agency assignment must match role requirements",
      path: ["agencyId"],
    }
  );

// User update schema
export const updateUserSchema = z.object({
  id: z.string().cuid("Invalid user ID"),
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  phone: z.string().min(10).max(20).optional(),
  whatsapp: z.string().min(10).max(20).optional(),
  active: z.boolean().optional(),
  avatarUrl: z.string().url("Invalid avatar URL").optional(),
});

// Agent creation schema (for Agency Admins creating agents)
export const createAgentSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters"),
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters"),
  phone: z
    .string()
    .min(10, "Phone must be at least 10 characters")
    .max(20, "Phone must be less than 20 characters")
    .optional(),
  whatsapp: z
    .string()
    .min(10, "WhatsApp must be at least 10 characters")
    .max(20, "WhatsApp must be less than 20 characters")
    .optional(),
});

// User ID parameter schema
export const userIdSchema = z.object({
  id: z.string().cuid("Invalid user ID"),
});

// User query filters schema
export const userQuerySchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  agencyId: z.string().cuid().optional(),
  active: z.boolean().optional(),
  search: z.string().optional(), // For text search in name
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  sortBy: z
    .enum(["createdAt", "updatedAt", "firstName", "lastName"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Password change schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(100, "New password must be less than 100 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UserIdInput = z.infer<typeof userIdSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
