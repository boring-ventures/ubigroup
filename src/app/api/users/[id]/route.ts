import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET: Fetch specific user
export async function GET(
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

    // Fetch user with agency information
    const userData = await prisma.user.findUnique({
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

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update user
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
    const { firstName, lastName, role, phone, whatsapp, agencyId, active } =
      body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validate role if provided
    if (role && !["SUPER_ADMIN", "AGENCY_ADMIN", "AGENT"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if agency is required for non-SUPER_ADMIN roles
    if (role && role !== "SUPER_ADMIN" && !agencyId) {
      return NextResponse.json(
        { error: "Agency is required for non-Super Admin roles" },
        { status: 400 }
      );
    }

    // Check if agency exists (for non-SUPER_ADMIN roles)
    if (role && role !== "SUPER_ADMIN" && agencyId) {
      const agency = await prisma.agency.findUnique({
        where: { id: agencyId },
      });

      if (!agency) {
        return NextResponse.json(
          { error: "Agency not found" },
          { status: 404 }
        );
      }
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(role !== undefined && { role }),
        ...(phone !== undefined && { phone }),
        ...(whatsapp !== undefined && { whatsapp }),
        ...(agencyId !== undefined && {
          agencyId: role === "SUPER_ADMIN" ? null : agencyId,
        }),
        ...(active !== undefined && { active }),
      },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Try to update user metadata in Supabase Auth if possible
    try {
      if (existingUser.userId && existingUser.userId !== existingUser.id) {
        // User has a real Supabase auth ID
        await supabaseAdmin.auth.admin.updateUserById(existingUser.userId, {
          user_metadata: {
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            role: updatedUser.role,
          },
        });
      }
    } catch (authUpdateError) {
      console.warn(
        "Failed to update user metadata in Supabase Auth:",
        authUpdateError
      );
      // Continue anyway - database update was successful
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete user
export async function DELETE(
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

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent deleting yourself
    if (existingUser.userId === user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Delete user from database first
    await prisma.user.delete({
      where: { id },
    });

    // Try to delete user from Supabase Auth if possible
    try {
      if (existingUser.userId && existingUser.userId !== existingUser.id) {
        // User has a real Supabase auth ID
        await supabaseAdmin.auth.admin.deleteUser(existingUser.userId);
      }
    } catch (authDeleteError) {
      console.warn(
        "Failed to delete user from Supabase Auth:",
        authDeleteError
      );
      // Continue anyway - database deletion was successful
    }

    return NextResponse.json({
      message: "User deleted successfully",
      deletedUserId: id,
    });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
