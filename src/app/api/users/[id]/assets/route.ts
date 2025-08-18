import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

// GET: Check user assets (properties and projects)
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

    // Only SUPER_ADMIN and AGENCY_ADMIN can check user assets
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
      // Agency Admin can only check users from their agency
      if (existingUser.agencyId !== currentUser.agencyId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Count user's properties and projects
    const [propertiesCount, projectsCount] = await Promise.all([
      prisma.property.count({
        where: { agentId: id },
      }),
      prisma.project.count({
        where: { agentId: id },
      }),
    ]);

    return NextResponse.json({
      propertiesCount,
      projectsCount,
    });
  } catch (error) {
    console.error("Failed to check user assets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
