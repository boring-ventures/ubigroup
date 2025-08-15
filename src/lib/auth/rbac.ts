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
 * Get the appropriate redirect URL based on user role
 */
export function getRoleBasedRedirectUrl(user: AuthenticatedUser): string {
  switch (user.role) {
    case "SUPER_ADMIN":
      return "/dashboard";
    case "AGENCY_ADMIN":
      return "/dashboard";
    case "AGENT":
      return "/dashboard";
    default:
      return "/dashboard";
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
  if (user.role === UserRole.AGENCY_ADMIN) {
    return targetAgencyId ? belongsToAgency(user, targetAgencyId) : true;
  }
  return false;
}

/**
 * Check if user can manage a specific property
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
  if (user.role === UserRole.AGENT) {
    return propertyAgentId === user.id;
  }
  return false;
}

/**
 * Higher-order function to wrap API routes with authentication and role checks
 */
export function withAuth() {
  return function (handler: (req: Request) => Promise<Response>) {
    return async function (req: Request) {
      // This would need to be implemented in server-side API routes
      // For now, we'll keep the client-side utilities
      return handler(req);
    };
  };
}

/**
 * Validate request body against a schema
 */
export function validateRequestBody<T>(
  schema: {
    safeParse: (data: unknown) => {
      success: boolean;
      data?: T;
      error?: { errors: Array<{ message: string }> };
    };
  },
  body: unknown
): { data: T | null; error: string | null } {
  try {
    const result = schema.safeParse(body);
    if (result.success && result.data) {
      return { data: result.data, error: null };
    } else {
      return {
        data: null,
        error:
          result.error?.errors
            .map((e: { message: string }) => e.message)
            .join(", ") || "Validation failed",
      };
    }
  } catch {
    return {
      data: null,
      error: "Validation failed",
    };
  }
}

/**
 * Validate query parameters against a schema
 */
export function validateQueryParams<T>(
  schema: {
    safeParse: (data: unknown) => {
      success: boolean;
      data?: T;
      error?: { errors: Array<{ message: string }> };
    };
  },
  searchParams: URLSearchParams
): { data: T | null; error: string | null } {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const result = schema.safeParse(params);
    if (result.success && result.data) {
      return { data: result.data, error: null };
    } else {
      return {
        data: null,
        error:
          result.error?.errors
            .map((e: { message: string }) => e.message)
            .join(", ") || "Query parameter validation failed",
      };
    }
  } catch {
    return {
      data: null,
      error: "Query parameter validation failed",
    };
  }
}
