import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

// Test endpoint to verify profile API functionality
export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Not authenticated",
          userError: userError?.message,
        },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Check if user exists in database
    const userProfile = await prisma.user.findUnique({
      where: { userId },
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
      authenticated: true,
      userId,
      userEmail: user.email,
      profileExists: !!userProfile,
      profile: userProfile,
      userMetadata: user.user_metadata,
    });
  } catch (error) {
    console.error("Test profile error:", error);
    return NextResponse.json(
      {
        error: "Test failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
