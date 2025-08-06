import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get current user to verify they're a Super Admin
    const currentUser = await prisma.user.findUnique({
      where: { userId: user.id },
    });

    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          error: "Only Super Admins can access property statistics",
        },
        { status: 403 }
      );
    }

    // Get property statistics
    const [total, approved, pending, rejected, totalValueResult] =
      await Promise.all([
        prisma.property.count(),
        prisma.property.count({ where: { status: "APPROVED" } }),
        prisma.property.count({ where: { status: "PENDING" } }),
        prisma.property.count({ where: { status: "REJECTED" } }),
        prisma.property.aggregate({
          _sum: {
            price: true,
          },
          where: {
            status: "APPROVED",
          },
        }),
      ]);

    const stats = {
      total,
      approved,
      pending,
      rejected,
      totalValue: totalValueResult._sum.price || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch property statistics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
