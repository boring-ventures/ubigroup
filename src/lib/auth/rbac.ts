import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export type AuthenticatedUser = {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  agencyId: string | null;
  active: boolean;
};

/**
 * Authenticate user from request and return user data
 */
export async function authenticateUser(): Promise<{
  user: AuthenticatedUser | null;
  error: string | null;
}> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { user: null, error: "Unauthorized" };
    }

    // Get user profile from database
    const dbUser = await prisma.user.findUnique({
      where: { userId: authUser.id },
    });

    if (!dbUser || !dbUser.active) {
      return { user: null, error: "User not found or inactive" };
    }

    return {
      user: {
        id: dbUser.id,
        userId: dbUser.userId,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        role: dbUser.role,
        agencyId: dbUser.agencyId,
        active: dbUser.active,
      },
      error: null,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return { user: null, error: "Internal authentication error" };
  }
}

/**
 * Check if user has required role
 */
export function hasRole(
  user: AuthenticatedUser,
  allowedRoles: UserRole[]
): boolean {
  return allowedRoles.includes(user.role);
}

/**
 * Check if user belongs to specific agency (for Agency Admins and Agents)
 */
export function belongsToAgency(
  user: AuthenticatedUser,
  agencyId: string
): boolean {
  return user.agencyId === agencyId;
}

/**
 * Check if user can access agency data (Super Admin or belongs to agency)
 */
export function canAccessAgency(
  user: AuthenticatedUser,
  agencyId: string
): boolean {
  return user.role === UserRole.SUPER_ADMIN || belongsToAgency(user, agencyId);
}

/**
 * Check if user can manage users (Super Admin or Agency Admin for their agency)
 */
export function canManageUsers(
  user: AuthenticatedUser,
  targetAgencyId?: string
): boolean {
  if (user.role === UserRole.SUPER_ADMIN) {
    return true;
  }

  if (user.role === UserRole.AGENCY_ADMIN && targetAgencyId) {
    return belongsToAgency(user, targetAgencyId);
  }

  return false;
}

/**
 * Check if user can manage properties (Agent for own properties, Agency Admin for agency properties, Super Admin for all)
 */
export function canManageProperty(
  user: AuthenticatedUser,
  propertyAgencyId: string,
  propertyAgentId?: string
): boolean {
  if (user.role === UserRole.SUPER_ADMIN) {
    return true;
  }

  if (user.role === UserRole.AGENCY_ADMIN) {
    return belongsToAgency(user, propertyAgencyId);
  }

  if (user.role === UserRole.AGENT && propertyAgentId) {
    return user.id === propertyAgentId;
  }

  return false;
}

/**
 * Middleware wrapper for role-based access control
 */
export function withAuth(allowedRoles: UserRole[]) {
  return async function (
    handler: (
      req: NextRequest,
      user: AuthenticatedUser
    ) => Promise<NextResponse>
  ) {
    return async function (req: NextRequest) {
      const { user, error } = await authenticateUser();

      if (!user) {
        return NextResponse.json(
          { error: error || "Unauthorized" },
          { status: 401 }
        );
      }

      if (!hasRole(user, allowedRoles)) {
        return NextResponse.json(
          { error: "Forbidden - Insufficient permissions" },
          { status: 403 }
        );
      }

      return handler(req, user);
    };
  };
}

/**
 * Validate request body with Zod schema
 */
export function validateRequestBody<T>(
  schema: any,
  body: any
): { data: T | null; error: string | null } {
  try {
    console.log("Validating request body:", body);
    console.log("Schema:", schema);

    const result = schema.safeParse(body);

    if (!result.success) {
      console.log("Validation failed:", result.error);
      const errors = result.error.errors
        .map((err: any) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      return { data: null, error: `Validation error: ${errors}` };
    }

    console.log("Validation successful:", result.data);
    return { data: result.data, error: null };
  } catch (error) {
    console.error("Validation error:", error);
    return { data: null, error: "Invalid request data" };
  }
}

/**
 * Validate query parameters with Zod schema
 */
export function validateQueryParams<T>(
  schema: any,
  searchParams: URLSearchParams
): { data: T | null; error: string | null } {
  try {
    const params: Record<string, any> = {};

    // Convert URLSearchParams to object with proper type conversion
    for (const [key, value] of searchParams.entries()) {
      // Convert string numbers to actual numbers
      if (!isNaN(Number(value)) && value !== "") {
        params[key] = Number(value);
      }
      // Convert string booleans to actual booleans
      else if (value === "true" || value === "false") {
        params[key] = value === "true";
      }
      // Handle arrays (e.g., features=pool,garden)
      else if (value.includes(",")) {
        params[key] = value.split(",").map((v) => v.trim());
      }
      // Keep as string
      else {
        params[key] = value;
      }
    }

    const result = schema.safeParse(params);

    if (!result.success) {
      const errors = result.error.errors
        .map((err: any) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      return { data: null, error: `Query validation error: ${errors}` };
    }

    return { data: result.data, error: null };
  } catch (error) {
    return { data: null, error: "Invalid query parameters" };
  }
}
