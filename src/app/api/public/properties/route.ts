import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  PropertyStatus,
  PropertyType,
  TransactionType,
  Prisma,
} from "@prisma/client";

// GET - Fetch public properties (all approved properties without user filtering)
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

    // Build where clause - public endpoint only shows approved properties
    const whereClause: Prisma.PropertyWhereInput = {
      status: PropertyStatus.APPROVED,
    };

    // Apply search filter if provided
    const search = (searchParams.get("search") || "").trim();
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
        {
          locationCity: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          locationState: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          municipality: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          locationNeigh: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          address: {
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
    console.error("Error fetching public properties:", error);
    return NextResponse.json(
      { error: "Error fetching properties" },
      { status: 500 }
    );
  }
}
