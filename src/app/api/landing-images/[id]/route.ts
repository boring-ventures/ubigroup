import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth/server-auth";
import prisma from "@/lib/prisma";
import { updateLandingImageSchema } from "@/lib/validations/landing-image";
import { UserRole } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const landingImage = await prisma.landingImage.findUnique({
      where: { id },
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

    if (!landingImage) {
      return NextResponse.json(
        { error: "Landing image not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(landingImage);
  } catch (error) {
    console.error("Error fetching landing image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
    const validatedData = updateLandingImageSchema.parse(body);

    // Check if landing image exists
    const existingImage = await prisma.landingImage.findUnique({
      where: { id },
    });

    if (!existingImage) {
      return NextResponse.json(
        { error: "Landing image not found" },
        { status: 404 }
      );
    }

    // Update landing image
    const landingImage = await prisma.landingImage.update({
      where: { id },
      data: validatedData,
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

    return NextResponse.json(landingImage);
  } catch (error) {
    console.error("Error updating landing image:", error);

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Check if landing image exists
    const existingImage = await prisma.landingImage.findUnique({
      where: { id },
    });

    if (!existingImage) {
      return NextResponse.json(
        { error: "Landing image not found" },
        { status: 404 }
      );
    }

    // Hard delete the landing image
    await prisma.landingImage.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Landing image deleted successfully" });
  } catch (error) {
    console.error("Error deleting landing image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
