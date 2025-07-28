import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";

// PATCH: Reset user password
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Use getUser() instead of getSession() for better security
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user to check if they're a SUPER_ADMIN
    const currentUser = await prisma.user.findUnique({
      where: { userId: user.id },
    });

    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { password } = body;

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update password in Supabase Auth if user has a real auth ID
    try {
      if (existingUser.userId && existingUser.userId !== existingUser.id) {
        // User has a real Supabase auth ID
        await supabaseAdmin.auth.admin.updateUserById(existingUser.userId, {
          password: password,
        });
      } else {
        // User doesn't have a real auth ID, we can't update password
        return NextResponse.json(
          { error: "Cannot reset password for this user type" },
          { status: 400 }
        );
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

    return NextResponse.json({
      message: "Password updated successfully",
      userId: existingUser.userId,
    });
  } catch (error) {
    console.error("Failed to reset password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
