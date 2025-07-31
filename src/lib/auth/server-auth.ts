import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
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
 * Authenticate user from request and return user data (Server-side only)
 */
export async function authenticateUser(): Promise<{
  user: AuthenticatedUser | null;
  error: string | null;
}> {
  try {
    const cookieStore = cookies();
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
