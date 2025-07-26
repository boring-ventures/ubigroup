import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import {
  authenticateUser,
  validateRequestBody,
  validateQueryParams,
} from "@/lib/auth/rbac";
import {
  createAgencySchema,
  agencyQuerySchema,
  CreateAgencyInput,
  AgencyQueryInput,
} from "@/lib/validations/agency";

// GET - Fetch agencies (Super Admin only)
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

    // Only Super Admins can access agency management
    if (user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const { data: queryParams, error: validationError } =
      validateQueryParams<AgencyQueryInput>(agencyQuerySchema, searchParams);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Build where clause
    let whereClause: any = {};

    if (queryParams.active !== undefined) {
      whereClause.active = queryParams.active;
    }

    if (queryParams.search) {
      whereClause.OR = [
        { name: { contains: queryParams.search, mode: "insensitive" } },
        { email: { contains: queryParams.search, mode: "insensitive" } },
      ];
    }

    // Fetch agencies with pagination and counts
    const [agencies, totalCount] = await Promise.all([
      prisma.agency.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              users: true,
              properties: true,
            },
          },
        },
        orderBy: {
          [queryParams.sortBy]: queryParams.sortOrder,
        },
        take: queryParams.limit,
        skip: queryParams.offset,
      }),
      prisma.agency.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      agencies,
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
    console.error("Failed to fetch agencies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new agency (Super Admin only)
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

    // Only Super Admins can create agencies
    if (user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate request body
    const body = await request.json();
    const { data: agencyData, error: validationError } =
      validateRequestBody<CreateAgencyInput>(createAgencySchema, body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Check if agency name already exists
    const existingAgency = await prisma.agency.findUnique({
      where: { name: agencyData.name },
    });

    if (existingAgency) {
      return NextResponse.json(
        { error: "Agency with this name already exists" },
        { status: 400 }
      );
    }

    // Create agency
    const agency = await prisma.agency.create({
      data: {
        name: agencyData.name,
        logoUrl: agencyData.logoUrl || null,
        address: agencyData.address || null,
        phone: agencyData.phone || null,
        email: agencyData.email || null,
        active: true,
      },
      include: {
        _count: {
          select: {
            users: true,
            properties: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        agency,
        message: `Agency "${agency.name}" created successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create agency:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
