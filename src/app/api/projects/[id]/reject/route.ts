import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth/server-auth";
import { PropertyStatus } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const { user, error: authError } = await authenticateUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile to check permissions
    const userProfile = await prisma.user.findUnique({
      where: { userId: user.id },
      include: { agency: true },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Only agency admins can reject projects
    if (userProfile.role !== "AGENCY_ADMIN") {
      return NextResponse.json(
        { error: "Only agency admins can reject projects" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { rejectionMessage } = body;

    // Check if project exists and belongs to the admin's agency
    const existingProject = await prisma.project.findUnique({
      where: { id },
      include: { agency: true },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (existingProject.agencyId !== userProfile.agencyId) {
      return NextResponse.json(
        { error: "You are not authorized to reject this project" },
        { status: 403 }
      );
    }

    // Update project status to rejected
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        status: PropertyStatus.REJECTED,
        rejectionMessage: rejectionMessage || null,
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
          },
        },
      },
    });

    return NextResponse.json({
      message: `Project "${updatedProject.name}" has been rejected`,
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error rejecting project:", error);
    return NextResponse.json(
      { error: "Error rejecting project" },
      { status: 500 }
    );
  }
}
