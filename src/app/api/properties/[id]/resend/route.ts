import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth/server-auth";
import { UserRole } from "@prisma/client";

// POST - Resend property for approval
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 }
      );
    }

    // Authenticate user
    const { user, error: authError } = await authenticateUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || "Unauthorized" },
        { status: 401 }
      );
    }

    // Only agents can resend their own properties for approval
    if (user.role !== UserRole.AGENT) {
      return NextResponse.json(
        { error: "Only agents can resend properties for approval" },
        { status: 403 }
      );
    }

    // Check if property exists and belongs to the user
    const existingProperty = await prisma.property.findFirst({
      where: {
        id,
        agentId: user.id,
        status: "REJECTED", // Only rejected properties can be resent
      },
      select: {
        id: true,
        title: true,
        status: true,
        rejectionMessage: true,
      },
    });

    if (!existingProperty) {
      return NextResponse.json(
        { error: "Property not found or not eligible for resubmission" },
        { status: 404 }
      );
    }

    // Update property status to pending and clear rejection message
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        status: "PENDING",
        rejectionMessage: null,
      },
      include: {
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        agency: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: `Property "${updatedProperty.title}" has been resent for approval`,
      property: updatedProperty,
    });
  } catch (error) {
    console.error("Error resending property for approval:", error);
    return NextResponse.json(
      { error: "Error resending property for approval" },
      { status: 500 }
    );
  }
}

