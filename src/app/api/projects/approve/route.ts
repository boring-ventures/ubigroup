import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { UserRole, PropertyStatus } from "@prisma/client";
import { authenticateUser } from "@/lib/auth/server-auth";

// GET - Fetch pending projects for approval
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

    // Only agency admins can approve projects
    if (user.role !== UserRole.AGENCY_ADMIN) {
      return NextResponse.json(
        { error: "Only agency admins can approve projects" },
        { status: 403 }
      );
    }

    // Build where clause for pending projects from the user's agency
    const whereClause = {
      status: PropertyStatus.PENDING,
      agencyId: user.agencyId!,
    };

    // Fetch pending projects with pagination
    const [projects, totalCount] = await Promise.all([
      prisma.project.findMany({
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
          floors: {
            include: {
              quadrants: {
                select: {
                  id: true,
                  customId: true,
                  status: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "asc", // Show oldest first
        },
        take: limit,
        skip: offset,
      }),
      prisma.project.count({ where: whereClause }),
    ]);

    // Transform projects to match expected format
    const transformedProjects = projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      location: project.location,
      images: project.images,
      brochureUrl: project.brochureUrl,
      googleMapsUrl: project.googleMapsUrl,
      latitude: project.latitude,
      longitude: project.longitude,
      status: project.status,
      rejectionMessage: project.rejectionMessage,
      agent: project.agent
        ? {
            id: project.agent.id,
            firstName: project.agent.firstName,
            lastName: project.agent.lastName,
            phone: project.agent.phone,
          }
        : null,
      agency: project.agency,
      floors: project.floors,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    }));

    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      projects: transformedProjects,
      total: totalCount,
      totalPages,
      currentPage,
    });
  } catch (error) {
    console.error("Error fetching pending projects:", error);
    return NextResponse.json(
      { error: "Error fetching pending projects" },
      { status: 500 }
    );
  }
}

// POST - Approve or reject a project
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

    // Only agency admins can approve projects
    if (user.role !== UserRole.AGENCY_ADMIN) {
      return NextResponse.json(
        { error: "Only agency admins can approve projects" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { id: projectId, status, rejectionMessage } = body;

    if (!projectId || !status) {
      return NextResponse.json(
        { error: "Project ID and status are required" },
        { status: 400 }
      );
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be either APPROVED or REJECTED" },
        { status: 400 }
      );
    }

    // If rejecting, require rejection message
    if (status === "REJECTED" && (!rejectionMessage || rejectionMessage.trim().length === 0)) {
      return NextResponse.json(
        { error: "Rejection message is required when rejecting a project" },
        { status: 400 }
      );
    }

    // Check if project exists and belongs to the user's agency
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        agencyId: user.agencyId!,
        status: PropertyStatus.PENDING,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or not pending approval" },
        { status: 404 }
      );
    }

    // Update project status
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: status as PropertyStatus,
        rejectionMessage: status === "REJECTED" ? rejectionMessage.trim() : null,
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
        floors: {
          include: {
            quadrants: {
              select: {
                id: true,
                customId: true,
                status: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: `Project ${status.toLowerCase()} successfully`,
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error updating project status:", error);
    return NextResponse.json(
      { error: "Error updating project status" },
      { status: 500 }
    );
  }
}




