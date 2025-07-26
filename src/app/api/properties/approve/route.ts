import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { UserRole, PropertyStatus } from "@prisma/client";
import {
  authenticateUser,
  validateRequestBody,
  belongsToAgency,
} from "@/lib/auth/rbac";
import {
  updatePropertyStatusSchema,
  UpdatePropertyStatusInput,
} from "@/lib/validations/property";

// POST - Approve or reject property (Agency Admins only)
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

    // Only Agency Admins and Super Admins can approve/reject properties
    if (
      user.role !== UserRole.AGENCY_ADMIN &&
      user.role !== UserRole.SUPER_ADMIN
    ) {
      return NextResponse.json(
        {
          error:
            "Only Agency Admins and Super Admins can approve or reject properties",
        },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const { data: approvalData, error: validationError } =
      validateRequestBody<UpdatePropertyStatusInput>(
        updatePropertyStatusSchema,
        body
      );

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id: approvalData.id },
      include: {
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        agency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!existingProperty) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    // Check permissions - Agency Admins can only approve properties from their agency
    if (
      user.role === UserRole.AGENCY_ADMIN &&
      !belongsToAgency(user, existingProperty.agencyId)
    ) {
      return NextResponse.json(
        { error: "You can only approve properties from your agency" },
        { status: 403 }
      );
    }

    // Validate status transition
    if (
      existingProperty.status === PropertyStatus.APPROVED &&
      approvalData.status === PropertyStatus.APPROVED
    ) {
      return NextResponse.json(
        { error: "Property is already approved" },
        { status: 400 }
      );
    }

    if (
      existingProperty.status === PropertyStatus.REJECTED &&
      approvalData.status === PropertyStatus.REJECTED
    ) {
      return NextResponse.json(
        { error: "Property is already rejected" },
        { status: 400 }
      );
    }

    // For rejection, ensure rejection reason is provided
    if (
      approvalData.status === PropertyStatus.REJECTED &&
      !approvalData.rejectionReason
    ) {
      return NextResponse.json(
        { error: "Rejection reason is required when rejecting a property" },
        { status: 400 }
      );
    }

    // Update property status
    const updateData: any = {
      status: approvalData.status,
      updatedAt: new Date(),
    };

    // If rejecting, we could store the rejection reason in a separate field
    // For now, we'll include it in the update but it won't be stored unless we add the field to schema
    if (
      approvalData.status === PropertyStatus.REJECTED &&
      approvalData.rejectionReason
    ) {
      // Note: rejectionReason field would need to be added to Property model to store this
      // For now, we'll just log it or handle it differently
      console.log(
        `Property ${approvalData.id} rejected with reason: ${approvalData.rejectionReason}`
      );
    }

    const updatedProperty = await prisma.property.update({
      where: { id: approvalData.id },
      data: updateData,
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

    // Prepare response message
    const statusText =
      approvalData.status === PropertyStatus.APPROVED ? "approved" : "rejected";
    const message = `Property "${existingProperty.title}" has been ${statusText} successfully`;

    return NextResponse.json({
      property: updatedProperty,
      message,
      previousStatus: existingProperty.status,
      newStatus: approvalData.status,
      approvedBy: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
      },
      ...(approvalData.rejectionReason && {
        rejectionReason: approvalData.rejectionReason,
      }),
    });
  } catch (error) {
    console.error("Error updating property status:", error);
    return NextResponse.json(
      { error: "Error updating property status" },
      { status: 500 }
    );
  }
}

// GET - Get pending properties for approval (Agency Admins and Super Admins)
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

    // Only Agency Admins and Super Admins can view pending properties
    if (
      user.role !== UserRole.AGENCY_ADMIN &&
      user.role !== UserRole.SUPER_ADMIN
    ) {
      return NextResponse.json(
        {
          error:
            "Only Agency Admins and Super Admins can view pending properties",
        },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    let whereClause: any = {
      status: PropertyStatus.PENDING,
    };

    // Agency Admins can only see pending properties from their agency
    if (user.role === UserRole.AGENCY_ADMIN) {
      whereClause.agencyId = user.agencyId;
    }

    // Super Admins can filter by agency if specified
    const agencyFilter = searchParams.get("agencyId");
    if (user.role === UserRole.SUPER_ADMIN && agencyFilter) {
      whereClause.agencyId = agencyFilter;
    }

    // Fetch pending properties
    const [pendingProperties, totalCount] = await Promise.all([
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
          createdAt: "asc", // Oldest first for approval queue
        },
        take: limit,
        skip: offset,
      }),
      prisma.property.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      pendingProperties,
      totalCount,
      hasMore: offset + limit < totalCount,
      pagination: {
        limit,
        offset,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching pending properties:", error);
    return NextResponse.json(
      { error: "Error fetching pending properties" },
      { status: 500 }
    );
  }
}
