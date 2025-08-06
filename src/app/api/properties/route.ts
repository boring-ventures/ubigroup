import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  UserRole,
  PropertyStatus,
  PropertyType,
  TransactionType,
} from "@prisma/client";
import { authenticateUser } from "@/lib/auth/server-auth";
import { validateRequestBody } from "@/lib/auth/rbac";
import {
  createPropertySchema,
  CreatePropertyInput,
} from "@/lib/validations/property";
import { generateCustomPropertyId } from "@/lib/utils";

// GET - Fetch properties with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Set default values
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");
    const offset = parseInt(
      searchParams.get("offset") || ((page - 1) * limit).toString()
    );
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const status = searchParams.get("status");

    // Validate basic parameters
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid limit parameter" },
        { status: 400 }
      );
    }
    if (offset < 0) {
      return NextResponse.json(
        { error: "Invalid offset parameter" },
        { status: 400 }
      );
    }
    if (!["createdAt", "updatedAt", "price", "title"].includes(sortBy)) {
      return NextResponse.json(
        { error: "Invalid sortBy parameter" },
        { status: 400 }
      );
    }
    if (!["asc", "desc"].includes(sortOrder)) {
      return NextResponse.json(
        { error: "Invalid sortOrder parameter" },
        { status: 400 }
      );
    }

    // Try to authenticate user
    const { user } = await authenticateUser();
    const isAuthenticated = !!user;

    // Build where clause
    const whereClause: any = {};

    // Handle status filter and user-specific filtering based on authentication
    if (isAuthenticated) {
      // Authenticated users can see all statuses or filter by specific status
      if (status && status !== "all") {
        whereClause.status = status;
      }

      // Filter by user role and permissions
      if (user.role === UserRole.AGENT) {
        // Agents can only see their own properties
        whereClause.agentId = user.id;
      } else if (user.role === UserRole.AGENCY_ADMIN) {
        // Agency admins can see all properties from their agency
        whereClause.agencyId = user.agencyId;
      }
      // Super admins can see all properties (no additional filter needed)
    } else {
      // Public access only shows approved properties
      whereClause.status = "APPROVED";
    }

    // Apply search filter if provided
    const search = searchParams.get("search");
    if (search) {
      whereClause.OR = [
        {
          title: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Apply other filters
    const type = searchParams.get("type");
    if (type) {
      whereClause.type = type as PropertyType;
    }

    const transactionType = searchParams.get("transactionType");
    if (transactionType) {
      whereClause.transactionType = transactionType as TransactionType;
    }

    const locationState = searchParams.get("locationState");
    if (locationState) {
      whereClause.locationState = {
        contains: locationState,
        mode: "insensitive",
      };
    }

    const locationCity = searchParams.get("locationCity");
    if (locationCity) {
      whereClause.locationCity = {
        contains: locationCity,
        mode: "insensitive",
      };
    }

    const municipality = searchParams.get("municipality");
    if (municipality) {
      whereClause.municipality = {
        contains: municipality,
        mode: "insensitive",
      };
    }

    // Price range filters
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price.gte = parseFloat(minPrice);
      if (maxPrice) whereClause.price.lte = parseFloat(maxPrice);
    }

    // Bedrooms range filters
    const minBedrooms = searchParams.get("minBedrooms");
    const maxBedrooms = searchParams.get("maxBedrooms");
    if (minBedrooms || maxBedrooms) {
      whereClause.bedrooms = {};
      if (minBedrooms) whereClause.bedrooms.gte = parseInt(minBedrooms);
      if (maxBedrooms) whereClause.bedrooms.lte = parseInt(maxBedrooms);
    }

    // Bathrooms range filters
    const minBathrooms = searchParams.get("minBathrooms");
    const maxBathrooms = searchParams.get("maxBathrooms");
    if (minBathrooms || maxBathrooms) {
      whereClause.bathrooms = {};
      if (minBathrooms) whereClause.bathrooms.gte = parseInt(minBathrooms);
      if (maxBathrooms) whereClause.bathrooms.lte = parseInt(maxBathrooms);
    }

    // Square meters range filters
    const minSquareMeters = searchParams.get("minSquareMeters");
    const maxSquareMeters = searchParams.get("maxSquareMeters");
    if (minSquareMeters || maxSquareMeters) {
      whereClause.squareMeters = {};
      if (minSquareMeters)
        whereClause.squareMeters.gte = parseFloat(minSquareMeters);
      if (maxSquareMeters)
        whereClause.squareMeters.lte = parseFloat(maxSquareMeters);
    }

    // Features filter
    const features = searchParams.getAll("features");
    if (features.length > 0) {
      whereClause.features = {
        hasSome: features,
      };
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
          [sortBy]: sortOrder,
        },
        take: limit,
        skip: offset,
      }),
      prisma.property.count({ where: whereClause }),
    ]);

    // Transform properties to match expected format
    const transformedProperties = properties.map((property) => ({
      id: property.id,
      customId: property.customId,
      title: property.title,
      description: property.description,
      type: property.type,
      locationState: property.locationState,
      locationCity: property.locationCity,
      locationNeigh: property.locationNeigh,
      municipality: property.municipality,
      address: property.address,
      googleMapsUrl: property.googleMapsUrl,
      latitude: property.latitude,
      longitude: property.longitude,
      price: property.price,
      currency: property.currency,
      exchangeRate: property.exchangeRate,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      garageSpaces: property.garageSpaces,
      squareMeters: property.squareMeters,
      transactionType: property.transactionType,
      status: property.status,
      images: property.images,
      videos: property.videos,
      features: property.features,
      agent: property.agent
        ? {
            firstName: property.agent.firstName,
            lastName: property.agent.lastName,
            phone: property.agent.phone,
            whatsapp: property.agent.whatsapp,
          }
        : {},
      agency: property.agency
        ? {
            name: property.agency.name,
            logoUrl: property.agency.logoUrl,
          }
        : {},
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
      hasMore: offset + limit < totalCount,
      pagination: {
        limit,
        offset,
        page: currentPage,
        totalPages,
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

    // Generate custom ID
    const customId = generateCustomPropertyId(propertyData!.transactionType);

    // Map form fields to database fields
    const mappedData = {
      customId,
      title: propertyData!.title,
      description: propertyData!.description,
      type: propertyData!.propertyType, // Map propertyType to type
      locationState: propertyData!.state, // Map state to locationState
      locationCity: propertyData!.city, // Map city to locationCity
      locationNeigh: propertyData!.city, // Use city as neighborhood for now
      municipality: propertyData!.municipality,
      address: propertyData!.address,
      googleMapsUrl: propertyData!.googleMapsUrl,
      latitude: propertyData!.latitude,
      longitude: propertyData!.longitude,
      price: propertyData!.price,
      currency: propertyData!.currency,
      exchangeRate: propertyData!.exchangeRate,
      bedrooms: propertyData!.bedrooms,
      bathrooms: propertyData!.bathrooms,
      garageSpaces: 0, // Default value
      squareMeters: propertyData!.area, // Map area to squareMeters
      transactionType: propertyData!.transactionType,
      images: propertyData!.images,
      videos: propertyData!.videos,
      features: propertyData!.features,
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
