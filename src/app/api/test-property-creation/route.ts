import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

// Test endpoint to verify property creation functionality
export async function GET() {
  try {
    const cookieStore = await cookies();
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

    // Check if user exists and is an agent
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

    if (!userProfile) {
      return NextResponse.json(
        {
          error: "User profile not found",
          userId,
          userEmail: user.email,
        },
        { status: 404 }
      );
    }

    if (userProfile.role !== "AGENT") {
      return NextResponse.json(
        {
          error: "User is not an agent",
          userId,
          userEmail: user.email,
          role: userProfile.role,
        },
        { status: 403 }
      );
    }

    // Check if user has an agency
    if (!userProfile.agencyId) {
      return NextResponse.json(
        {
          error: "Agent must belong to an agency",
          userId,
          userEmail: user.email,
          role: userProfile.role,
        },
        { status: 400 }
      );
    }

    // Test property creation with sample data
    const testPropertyData = {
      title: "Test Property",
      description: "This is a test property for debugging purposes",
      propertyType: "APARTMENT",
      transactionType: "SALE",
      address: "123 Test Street",
      city: "Test City",
      state: "Test State",
      zipCode: "12345",
      price: 100000,
      bedrooms: 2,
      bathrooms: 2,
      area: 1000,
      images: [],
      features: ["Test Feature"],
    };

    return NextResponse.json({
      authenticated: true,
      userId,
      userEmail: user.email,
      role: userProfile.role,
      agencyId: userProfile.agencyId,
      agencyName: userProfile.agency?.name,
      canCreateProperties: true,
      testData: testPropertyData,
    });
  } catch (error) {
    console.error("Test property creation error:", error);
    return NextResponse.json(
      {
        error: "Test failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
