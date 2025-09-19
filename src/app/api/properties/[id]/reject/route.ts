import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth/server-auth";
import { UserRole } from "@prisma/client";

// POST - Reject property with message
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

    // Only super admins and agency admins can reject properties
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.role !== UserRole.AGENCY_ADMIN
    ) {
      return NextResponse.json(
        { error: "Only super admins and agency admins can reject properties" },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { rejectionMessage } = body;

    if (!rejectionMessage || rejectionMessage.trim().length === 0) {
      return NextResponse.json(
        { error: "Rejection message is required" },
        { status: 400 }
      );
    }

    // Check if property exists and get agency information
    const existingProperty = await prisma.property.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        agencyId: true,
      },
    });

    if (!existingProperty) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    // If user is agency admin, ensure they can only reject properties from their agency
    if (user.role === UserRole.AGENCY_ADMIN) {
      if (user.agencyId !== existingProperty.agencyId) {
        return NextResponse.json(
          { error: "You can only reject properties from your own agency" },
          { status: 403 }
        );
      }
    }

    // Update property status to rejected and add rejection message
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionMessage: rejectionMessage.trim(),
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
      message: `Property "${updatedProperty.title}" has been rejected`,
      property: updatedProperty,
    });
  } catch (error) {
    console.error("Error rejecting property:", error);
    return NextResponse.json(
      { error: "Error rejecting property" },
      { status: 500 }
    );
  }
}
