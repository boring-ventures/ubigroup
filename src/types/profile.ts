import type { UserRole } from "@prisma/client";

export interface Profile {
  id: string;
  userId: string;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
  firstName?: string | null;
  lastName?: string | null;
  role: UserRole;
  phone?: string | null;
  agencyId?: string | null;
  requiresPasswordChange: boolean;
  agency?: {
    id: string;
    name: string;
  } | null;
}
