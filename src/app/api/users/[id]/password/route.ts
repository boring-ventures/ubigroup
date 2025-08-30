import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";

// PATCH: Reset user password
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Use getUser() instead of getSession() for better security
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user to check their role and agency
    const currentUser = await prisma.user.findUnique({
      where: { userId: user.id },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only SUPER_ADMIN and AGENCY_ADMIN can reset passwords
    if (
      currentUser.role !== "SUPER_ADMIN" &&
      currentUser.role !== "AGENCY_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const { password, email: userEmail } = body;

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Agency Admin restrictions
    if (currentUser.role === "AGENCY_ADMIN") {
      // Agency Admin can only reset passwords for users from their agency
      if (existingUser.agencyId !== currentUser.agencyId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Agency Admin cannot reset passwords for SUPER_ADMIN users
      if (existingUser.role === "SUPER_ADMIN") {
        return NextResponse.json(
          {
            error: "Agency Admins cannot reset passwords for Super Admin users",
          },
          { status: 403 }
        );
      }

      // Agency Admin cannot reset passwords for other AGENCY_ADMIN users
      if (existingUser.role === "AGENCY_ADMIN") {
        return NextResponse.json(
          {
            error:
              "Agency Admins cannot reset passwords for other Agency Admin users",
          },
          { status: 403 }
        );
      }
    }

    // Update password in Supabase Auth if user has a real auth ID
    try {
      if (existingUser.userId && existingUser.userId !== existingUser.id) {
        // User has a real Supabase auth ID
        await supabaseAdmin.auth.admin.updateUserById(existingUser.userId, {
          password: password,
        });

        // Set requiresPasswordChange to true so user must change password on next login
        await prisma.user.update({
          where: { id },
          data: { requiresPasswordChange: true },
        });

        // Get the user's email from Supabase Auth
        const { data: authUser, error: authError } =
          await supabaseAdmin.auth.admin.getUserById(existingUser.userId);

        if (authError) {
          console.error(
            "Failed to get user email from Supabase Auth:",
            authError
          );
        }

        return NextResponse.json({
          message: "Password updated successfully",
          userId: existingUser.userId,
          email: authUser?.user?.email || existingUser.userId, // Use email from Auth or fallback to userId
          user: {
            id: existingUser.id,
            userId: existingUser.userId,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            role: existingUser.role,
            agencyId: existingUser.agencyId,
          },
        });
      } else {
        // User doesn't have a real auth ID - try to create one in Supabase Auth
        try {
          // Use email from request body or fallback to userId
          const emailToUse = userEmail || existingUser.userId;

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(emailToUse)) {
            return NextResponse.json(
              { error: "Cannot reset password: invalid email format" },
              { status: 400 }
            );
          }

          // Create a user in Supabase Auth with the given password
          const { data: newAuthUser, error: createError } =
            await supabaseAdmin.auth.admin.createUser({
              email: emailToUse,
              password: password,
              email_confirm: true, // Auto-confirm the email
            });

          if (createError) {
            console.error(
              "Failed to create user in Supabase Auth:",
              createError
            );
            return NextResponse.json(
              { error: "Cannot create authentication for this user" },
              { status: 400 }
            );
          }

          // Update the user record to use the new auth ID
          await prisma.user.update({
            where: { id },
            data: {
              userId: newAuthUser.user.id,
              requiresPasswordChange: true,
            },
          });

          return NextResponse.json({
            message: "Password updated successfully",
            userId: newAuthUser.user.id,
            email: newAuthUser.user.email || emailToUse,
            user: {
              id: existingUser.id,
              userId: newAuthUser.user.id,
              firstName: existingUser.firstName,
              lastName: existingUser.lastName,
              role: existingUser.role,
              agencyId: existingUser.agencyId,
            },
          });
        } catch (fallbackError) {
          console.error("Failed to create fallback auth user:", fallbackError);
          return NextResponse.json(
            { error: "Cannot reset password for this user type" },
            { status: 400 }
          );
        }
      }
    } catch (authUpdateError) {
      console.error(
        "Failed to update password in Supabase Auth:",
        authUpdateError
      );
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Failed to reset password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
