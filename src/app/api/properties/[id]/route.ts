import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import {
  authenticateUser,
  validateRequestBody,
  canManageProperty,
} from "@/lib/auth/rbac";
import {
  updatePropertySchema,
  UpdatePropertyInput,
} from "@/lib/validations/property";

// GET - Fetch single property by ID
export async function GET(
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

    // Get authenticated user (optional for public access)
    const { user } = await authenticateUser();

    // Build where clause based on access permissions
    let whereClause: any = { id };

    // If not authenticated, only show approved properties
    if (!user) {
      whereClause.status = "APPROVED";
    } else {
      // Authenticated users can see based on their role
      if (user.role === UserRole.AGENT) {
        // Agents can see their own properties or approved properties
        whereClause.OR = [
          { id, agentId: user.id },
          { id, status: "APPROVED" },
        ];
      } else if (user.role === UserRole.AGENCY_ADMIN) {
        // Agency Admins can see properties from their agency
        whereClause.agencyId = user.agencyId;
      }
      // Super Admins can see any property (no additional filters)
    }

    const property = await prisma.property.findFirst({
      where: whereClause,
      include: {
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            whatsapp: true,
          },
        },
        agency: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ property });
  } catch (error) {
    console.error("Error fetching property:", error);
    return NextResponse.json(
      { error: "Error fetching property" },
      { status: 500 }
    );
  }
}

// PUT - Update property
export async function PUT(
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

    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id },
      select: { agentId: true, agencyId: true },
    });

    if (!existingProperty) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    // Check permissions
    if (
      !canManageProperty(
        user,
        existingProperty.agencyId,
        existingProperty.agentId
      )
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions to update this property" },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const { data: updateData, error: validationError } =
      validateRequestBody<UpdatePropertyInput>(updatePropertySchema, {
        ...body,
        id,
      });

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Remove id from update data
    const { id: _, ...propertyUpdateData } = updateData;

    // If agent is updating their property, reset status to PENDING if it was rejected
    if (user.role === UserRole.AGENT) {
      const currentProperty = await prisma.property.findUnique({
        where: { id },
        select: { status: true },
      });

      if (currentProperty?.status === "REJECTED") {
        (propertyUpdateData as any).status = "PENDING";
      }
    }

    // Update property
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: propertyUpdateData,
      include: {
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            whatsapp: true,
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

    return NextResponse.json({ property: updatedProperty });
  } catch (error) {
    console.error("Error updating property:", error);
    return NextResponse.json(
      { error: "Error updating property" },
      { status: 500 }
    );
  }
}

// DELETE - Delete property
export async function DELETE(
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

    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id },
      select: { agentId: true, agencyId: true, title: true },
    });

    if (!existingProperty) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    // Check permissions
    if (
      !canManageProperty(
        user,
        existingProperty.agencyId,
        existingProperty.agentId
      )
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions to delete this property" },
        { status: 403 }
      );
    }

    // Delete property
    await prisma.property.delete({
      where: { id },
    });

    return NextResponse.json({
      message: `Property "${existingProperty.title}" deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting property:", error);
    return NextResponse.json(
      { error: "Error deleting property" },
      { status: 500 }
    );
  }
}
