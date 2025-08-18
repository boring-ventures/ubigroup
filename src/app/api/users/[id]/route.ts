import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET: Fetch specific user
export async function GET(
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

    // Agency Admin can only view users from their agency
    if (currentUser.role === "AGENCY_ADMIN") {
      if (!currentUser.agencyId) {
        return NextResponse.json(
          { error: "Agency Admin must be assigned to an agency" },
          { status: 403 }
        );
      }
      if (userData.agencyId !== currentUser.agencyId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (currentUser.role !== "SUPER_ADMIN") {
      // Only SUPER_ADMIN and AGENCY_ADMIN can access this endpoint
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    // Only SUPER_ADMIN and AGENCY_ADMIN can update users
    if (
      currentUser.role !== "SUPER_ADMIN" &&
      currentUser.role !== "AGENCY_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const {
      firstName,
      lastName,
      role,
      phone,
      agencyId: initialAgencyId,
      active,
    } = body;

    // Initialize agencyId variable for potential reassignment
    let agencyId = initialAgencyId;

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
      // Agency Admin can only update users from their agency
      if (existingUser.agencyId !== currentUser.agencyId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Agency Admin cannot update users to SUPER_ADMIN role
      if (role === "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Agency Admins cannot update users to Super Admin role" },
          { status: 403 }
        );
      }

      // Agency Admin can only update users to AGENT and AGENCY_ADMIN roles
      if (role && !["AGENCY_ADMIN", "AGENT"].includes(role)) {
        return NextResponse.json(
          {
            error:
              "Agency Admins can only update users to Agent and Agency Admin roles",
          },
          { status: 403 }
        );
      }

      // Agency Admin can only assign users to their own agency
      if (
        role &&
        role !== "SUPER_ADMIN" &&
        agencyId &&
        agencyId !== currentUser.agencyId
      ) {
        return NextResponse.json(
          { error: "Agency Admins can only assign users to their own agency" },
          { status: 403 }
        );
      }

      // Automatically assign to the same agency if not provided
      if (role && role !== "SUPER_ADMIN" && !agencyId) {
        agencyId = currentUser.agencyId;
      }
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

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        role: role || undefined,
        phone: phone !== undefined ? phone : undefined,
        agencyId: role === "SUPER_ADMIN" ? null : agencyId || undefined,
        active: active !== undefined ? active : undefined,
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
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

    // Only SUPER_ADMIN and AGENCY_ADMIN can delete users
    if (
      currentUser.role !== "SUPER_ADMIN" &&
      currentUser.role !== "AGENCY_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
      // Agency Admin can only delete users from their agency
      if (existingUser.agencyId !== currentUser.agencyId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Agency Admin cannot delete SUPER_ADMIN users
      if (existingUser.role === "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Agency Admins cannot delete Super Admin users" },
          { status: 403 }
        );
      }

      // Agency Admin cannot delete other AGENCY_ADMIN users
      if (existingUser.role === "AGENCY_ADMIN") {
        return NextResponse.json(
          { error: "Agency Admins cannot delete other Agency Admin users" },
          { status: 403 }
        );
      }
    }

    // Prevent deleting yourself
    if (existingUser.userId === user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Delete user from database (this will cascade delete properties and projects)
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

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
