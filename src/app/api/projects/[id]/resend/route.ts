import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth/server-auth";
import { UserRole } from "@prisma/client";

// POST - Resend project for approval
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Project ID is required" },
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

    // Only agents can resend their own projects for approval
    if (user.role !== UserRole.AGENT) {
      return NextResponse.json(
        { error: "Only agents can resend projects for approval" },
        { status: 403 }
      );
    }

    // Check if project exists and belongs to the user
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        agentId: user.id,
        status: "REJECTED", // Only rejected projects can be resent
      },
      select: {
        id: true,
        name: true,
        status: true,
        rejectionMessage: true,
      },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found or not eligible for resubmission" },
        { status: 404 }
      );
    }

    // Update project status to pending and clear rejection message
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        status: "PENDING",
        rejectionMessage: null,
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
      message: `Project "${updatedProject.name}" has been resent for approval`,
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error resending project for approval:", error);
    return NextResponse.json(
      { error: "Error resending project for approval" },
      { status: 500 }
    );
  }
}




