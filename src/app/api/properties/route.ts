import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { UserRole, PropertyStatus } from "@prisma/client";
import {
  authenticateUser,
  validateRequestBody,
  validateQueryParams,
  canManageProperty,
} from "@/lib/auth/rbac";
import {
  createPropertySchema,
  propertyQuerySchema,
  CreatePropertyInput,
  PropertyQueryInput,
} from "@/lib/validations/property";

// GET - Fetch properties with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { data: queryParams, error: validationError } =
      validateQueryParams<PropertyQueryInput>(
        propertyQuerySchema,
        searchParams
      );

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // For public access, only show approved properties
    // For authenticated users, show based on their role and permissions
    const { user } = await authenticateUser();

    let whereClause: any = {};

    // Build where clause based on user role and filters
    if (!user) {
      // Public access - only approved properties
      whereClause.status = PropertyStatus.APPROVED;
    } else {
      // Authenticated access - apply role-based filters
      if (user.role === UserRole.AGENT) {
        // Agents can see their own properties (all statuses) + public approved properties
        if (queryParams.status || queryParams.agentId) {
          // If specific filters are applied, respect them
          if (queryParams.agentId === user.id) {
            // Agent viewing their own properties - all statuses
            whereClause.agentId = user.id;
          } else {
            // Agent viewing other properties - only approved
            whereClause.status = PropertyStatus.APPROVED;
          }
        } else {
          // Default for agents - their own properties
          whereClause.agentId = user.id;
        }
      } else if (user.role === UserRole.AGENCY_ADMIN) {
        // Agency Admins can see all properties from their agency
        whereClause.agencyId = user.agencyId;
      }
      // Super Admins can see all properties (no additional filters)
    }

    // Apply query filters
    if (queryParams.status) {
      whereClause.status = queryParams.status;
    }
    if (queryParams.type) {
      whereClause.type = queryParams.type;
    }
    if (queryParams.transactionType) {
      whereClause.transactionType = queryParams.transactionType;
    }
    if (queryParams.locationState) {
      whereClause.locationState = {
        contains: queryParams.locationState,
        mode: "insensitive",
      };
    }
    if (queryParams.locationCity) {
      whereClause.locationCity = {
        contains: queryParams.locationCity,
        mode: "insensitive",
      };
    }
    if (queryParams.locationNeigh) {
      whereClause.locationNeigh = {
        contains: queryParams.locationNeigh,
        mode: "insensitive",
      };
    }
    if (queryParams.minPrice || queryParams.maxPrice) {
      whereClause.price = {};
      if (queryParams.minPrice) whereClause.price.gte = queryParams.minPrice;
      if (queryParams.maxPrice) whereClause.price.lte = queryParams.maxPrice;
    }
    if (queryParams.minBedrooms || queryParams.maxBedrooms) {
      whereClause.bedrooms = {};
      if (queryParams.minBedrooms)
        whereClause.bedrooms.gte = queryParams.minBedrooms;
      if (queryParams.maxBedrooms)
        whereClause.bedrooms.lte = queryParams.maxBedrooms;
    }
    if (queryParams.minBathrooms || queryParams.maxBathrooms) {
      whereClause.bathrooms = {};
      if (queryParams.minBathrooms)
        whereClause.bathrooms.gte = queryParams.minBathrooms;
      if (queryParams.maxBathrooms)
        whereClause.bathrooms.lte = queryParams.maxBathrooms;
    }
    if (queryParams.minSquareMeters || queryParams.maxSquareMeters) {
      whereClause.squareMeters = {};
      if (queryParams.minSquareMeters)
        whereClause.squareMeters.gte = queryParams.minSquareMeters;
      if (queryParams.maxSquareMeters)
        whereClause.squareMeters.lte = queryParams.maxSquareMeters;
    }
    if (queryParams.features && queryParams.features.length > 0) {
      whereClause.features = {
        hasSome: queryParams.features,
      };
    }
    if (queryParams.search) {
      whereClause.OR = [
        {
          title: {
            contains: queryParams.search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: queryParams.search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Apply admin filters
    if (queryParams.agentId) {
      whereClause.agentId = queryParams.agentId;
    }
    if (queryParams.agencyId) {
      whereClause.agencyId = queryParams.agencyId;
    }

    // Fetch properties with pagination
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
          [queryParams.sortBy]: queryParams.sortOrder,
        },
        take: queryParams.limit,
        skip: queryParams.offset,
      }),
      prisma.property.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      properties,
      totalCount,
      hasMore: queryParams.offset + queryParams.limit < totalCount,
      pagination: {
        limit: queryParams.limit,
        offset: queryParams.offset,
        page: Math.floor(queryParams.offset / queryParams.limit) + 1,
        totalPages: Math.ceil(totalCount / queryParams.limit),
      },
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { error: "Error fetching properties" },
      { status: 500 }
    );
  }
}

// POST - Create new property (Agents only)
export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/properties - Starting property creation");

    // Authenticate user
    const { user, error: authError } = await authenticateUser();
    console.log("Authentication result:", { user: user?.id, error: authError });

    if (!user) {
      return NextResponse.json(
        { error: authError || "Unauthorized" },
        { status: 401 }
      );
    }

    // Only agents can create properties
    if (user.role !== UserRole.AGENT) {
      console.log("User role check failed:", {
        role: user.role,
        expected: UserRole.AGENT,
      });
      return NextResponse.json(
        { error: "Only agents can create properties" },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    console.log("Request body:", body);

    const { data: propertyData, error: validationError } =
      validateRequestBody<CreatePropertyInput>(createPropertySchema, body);

    if (validationError) {
      console.log("Validation error:", validationError);
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Map form fields to database fields
    const mappedData = {
      title: propertyData.title,
      description: propertyData.description,
      type: propertyData.propertyType, // Map propertyType to type
      locationState: propertyData.state, // Map state to locationState
      locationCity: propertyData.city, // Map city to locationCity
      locationNeigh: propertyData.city, // Use city as neighborhood for now
      address: propertyData.address,
      price: propertyData.price,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      garageSpaces: 0, // Default value
      squareMeters: propertyData.area, // Map area to squareMeters
      transactionType: propertyData.transactionType,
      images: propertyData.images,
      videos: propertyData.videos,
      features: propertyData.features,
    };

    console.log("Mapped data for database:", mappedData);
    console.log("User data:", {
      id: user.id,
      agencyId: user.agencyId,
      role: user.role,
    });

    // Check if user has an agency (required for agents)
    if (!user.agencyId) {
      console.error("User has no agency assigned:", user.id);
      return NextResponse.json(
        { error: "Agent must be assigned to an agency to create properties" },
        { status: 400 }
      );
    }

    // Create property
    const property = await prisma.property.create({
      data: {
        ...mappedData,
        agentId: user.id,
        agencyId: user.agencyId,
        status: PropertyStatus.PENDING, // All new properties start as pending
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

    console.log("Property created successfully:", property.id);
    return NextResponse.json({ property }, { status: 201 });
  } catch (error) {
    console.error("Error creating property:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error creating property",
      },
      { status: 500 }
    );
  }
}
