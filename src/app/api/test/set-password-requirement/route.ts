import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
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
    });

    return NextResponse.json({
      message: "Password requirement updated successfully",
      requiresPasswordChange: updatedUser.requiresPasswordChange,
    });
  } catch (error) {
    console.error("Error updating password requirement:", error);
    return NextResponse.json(
      { error: "Failed to update password requirement" },
      { status: 500 }
    );
  }
}
