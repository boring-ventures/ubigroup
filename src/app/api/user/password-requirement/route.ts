import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { requiresPasswordChange } = await request.json();

    if (typeof requiresPasswordChange !== "boolean") {
      return NextResponse.json(
        { error: "requiresPasswordChange must be a boolean" },
        { status: 400 }
      );
    }

    // Update the user's password change requirement
    const updatedUser = await prisma.user.update({
      where: { userId: user.id },
      data: { requiresPasswordChange },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: updatedUser.id,
      userId: updatedUser.userId,
      avatarUrl: updatedUser.avatarUrl,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      active: updatedUser.active,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role,
      phone: updatedUser.phone,
      agencyId: updatedUser.agencyId,
      requiresPasswordChange: updatedUser.requiresPasswordChange,
      agency: updatedUser.agency,
    });
  } catch (error) {
    console.error("Error updating password requirement:", error);
    return NextResponse.json(
      { error: "Failed to update password requirement" },
      { status: 500 }
    );
  }
}
