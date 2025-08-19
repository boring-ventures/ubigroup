import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth/server-auth";
import prisma from "@/lib/prisma";
import { createLandingImageSchema } from "@/lib/validations/landing-image";
import { UserRole, Prisma, LandingImageStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error: authError } = await authenticateUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is super admin
    if (user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: "Access denied. Super admin role required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const active = searchParams.get("active");

    // Build where clause - by default only show active images
    const where: Prisma.LandingImageWhereInput = { active: true };
    if (
      status &&
      Object.values(LandingImageStatus).includes(status as LandingImageStatus)
    ) {
      where.status = status as LandingImageStatus;
    }
    if (active !== null) {
      where.active = active === "true";
    }

    const landingImages = await prisma.landingImage.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(landingImages);
  } catch (error) {
    console.error("Error fetching landing images:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error: authError } = await authenticateUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is super admin
    if (user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: "Access denied. Super admin role required." },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = createLandingImageSchema.parse(body);

    // Create landing image
    const landingImage = await prisma.landingImage.create({
      data: {
        ...validatedData,
        createdById: user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(landingImage, { status: 201 });
  } catch (error) {
    console.error("Error creating landing image:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
