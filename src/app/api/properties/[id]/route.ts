import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { authenticateUser } from "@/lib/auth/server-auth";
import { validateRequestBody, canManageProperty } from "@/lib/auth/rbac";
import {
  createPropertySchema,
  CreatePropertyInput,
} from "@/lib/validations/property";

// GET - Fetch single property by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("Fetching property with ID:", id);

    if (!id) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 }
      );
    }

    // Get authenticated user
    const { user } = await authenticateUser();
    console.log("Authenticated user:", user?.id, "Role:", user?.role);

    // For testing, allow any authenticated user to view any property
    // TODO: Implement proper access control later
    const property = await prisma.property.findFirst({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
        agency: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            phone: true,
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
      validateRequestBody<CreatePropertyInput>(createPropertySchema, body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (!updateData) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Map form fields to database fields
    const mappedData = {
      title: updateData.title,
      description: updateData.description,
      type: updateData.propertyType, // Map propertyType to type
      locationState: updateData.state, // Map state to locationState
      locationCity: updateData.city, // Map city to locationCity
      locationNeigh: updateData.municipality || updateData.city, // Use municipality or city as neighborhood
      address: updateData.address,
      price: updateData.price,
      bedrooms: updateData.bedrooms,
      bathrooms: updateData.bathrooms,
      garageSpaces: updateData.garageSpaces,
      squareMeters: updateData.area, // Map area to squareMeters
      transactionType: updateData.transactionType,
      images: updateData.images,
      videos: updateData.videos,
      features: updateData.features,
      // Add optional fields if they exist
      ...(updateData.googleMapsUrl && { googleMapsUrl: updateData.googleMapsUrl }),
      ...(updateData.latitude !== undefined && { latitude: updateData.latitude }),
      ...(updateData.longitude !== undefined && { longitude: updateData.longitude }),
      // Add currency and exchange rate fields
      ...(updateData.currency && { currency: updateData.currency }),
      ...(updateData.exchangeRate !== undefined && { exchangeRate: updateData.exchangeRate }),
    };

    // If agent is updating their property, reset status to PENDING if it was rejected
    if (user.role === UserRole.AGENT) {
      const currentProperty = await prisma.property.findUnique({
        where: { id },
        select: { status: true },
      });

      if (currentProperty?.status === "REJECTED") {
        (mappedData as typeof mappedData & { status: string }).status =
          "PENDING";
      }
    }

    // Update property
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: mappedData,
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

    return NextResponse.json({ property: updatedProperty });
  } catch (error) {
    console.error("Error updating property:", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("Record to update not found")) {
        return NextResponse.json(
          { error: "Property not found" },
          { status: 404 }
        );
      }
      if (error.message.includes("Invalid")) {
        return NextResponse.json(
          { error: "Invalid property data" },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Error updating property", details: error instanceof Error ? error.message : "Unknown error" },
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
