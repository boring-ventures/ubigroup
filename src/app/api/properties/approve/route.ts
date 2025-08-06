import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { UserRole, PropertyStatus } from "@prisma/client";
import { authenticateUser } from "@/lib/auth/server-auth";

// GET - Fetch pending properties for approval
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Set default values
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const offset = parseInt(
      searchParams.get("offset") || ((page - 1) * limit).toString()
    );

    // Authenticate user
    const { user, error: authError } = await authenticateUser();

    if (!user) {
      return NextResponse.json(
        { error: authError || "Unauthorized" },
        { status: 401 }
      );
    }

    // Only agency admins can approve properties
    if (user.role !== UserRole.AGENCY_ADMIN) {
      return NextResponse.json(
        { error: "Only agency admins can approve properties" },
        { status: 403 }
      );
    }

    // Build where clause for pending properties from the user's agency
    const whereClause = {
      status: PropertyStatus.PENDING,
      agencyId: user.agencyId!,
    };

    // Fetch pending properties with pagination
    const [properties, totalCount] = await Promise.all([
      prisma.property.findMany({
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
            },
          },
        },
        orderBy: {
          createdAt: "asc", // Show oldest first
        },
        take: limit,
        skip: offset,
      }),
      prisma.property.count({ where: whereClause }),
    ]);

    // Transform properties to match expected format
    const transformedProperties = properties.map((property) => ({
      id: property.id,
      title: property.title,
      description: property.description,
      price: property.price,
      currency: property.currency,
      exchangeRate: property.exchangeRate,
      propertyType: property.type, // Map type to propertyType
      transactionType: property.transactionType,
      address: property.address || property.locationNeigh,
      city: property.locationCity, // Map locationCity to city
      state: property.locationState, // Map locationState to state
      zipCode: "", // Not in schema, using empty string
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.squareMeters, // Map squareMeters to area
      features: property.features,
      images: property.images,
      status: property.status,
      agent: property.agent
        ? {
            id: property.agent.id,
            firstName: property.agent.firstName,
            lastName: property.agent.lastName,
            email: "", // Not in schema, using empty string
          }
        : null,
      createdAt: property.createdAt.toISOString(),
      updatedAt: property.updatedAt.toISOString(),
    }));

    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      properties: transformedProperties,
      total: totalCount,
      totalPages,
      currentPage,
    });
  } catch (error) {
    console.error("Error fetching pending properties:", error);
    return NextResponse.json(
      { error: "Error fetching pending properties" },
      { status: 500 }
    );
  }
}

// POST - Approve or reject a property
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

    // Only agency admins can approve properties
    if (user.role !== UserRole.AGENCY_ADMIN) {
      return NextResponse.json(
        { error: "Only agency admins can approve properties" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { id: propertyId, status, rejectionReason } = body;

    if (!propertyId || !status) {
      return NextResponse.json(
        { error: "Property ID and status are required" },
        { status: 400 }
      );
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be either APPROVED or REJECTED" },
        { status: 400 }
      );
    }

    // Check if property exists and belongs to the user's agency
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        agencyId: user.agencyId!,
        status: PropertyStatus.PENDING,
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found or not pending approval" },
        { status: 404 }
      );
    }

    // Update property status
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: {
        status: status as PropertyStatus,
        // Note: rejectionReason field doesn't exist in schema, so we're not storing it
        // If you need to store rejection reasons, you'll need to add this field to the schema
      },
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

    return NextResponse.json({
      message: `Property ${status.toLowerCase()} successfully`,
      property: updatedProperty,
    });
  } catch (error) {
    console.error("Error updating property status:", error);
    return NextResponse.json(
      { error: "Error updating property status" },
      { status: 500 }
    );
  }
}
