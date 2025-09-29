import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth/server-auth";
import { createProjectSchema } from "@/lib/validations/project";

export async function PUT(
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

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check permissions: only the owning agent can update their project
    if (
      userProfile.role !== "AGENT" ||
      existingProject.agentId !== userProfile.id
    ) {
      return NextResponse.json(
        { error: "You are not authorized to update this project" },
        { status: 403 }
      );
    }

    // Parse and validate the request body
    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    // Update the project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        ...validatedData,
        // Reset status to PENDING when project is updated
        status: "PENDING",
        rejectionMessage: null,
      },
      include: {
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
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

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
      include: { agency: true },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check permissions: agency admins can delete projects from their agency, agents can delete their own projects
    if (userProfile.role === "AGENCY_ADMIN") {
      if (existingProject.agencyId !== userProfile.agencyId) {
        return NextResponse.json(
          { error: "You are not authorized to delete this project" },
          { status: 403 }
        );
      }
    } else if (userProfile.role === "AGENT") {
      if (existingProject.agentId !== userProfile.id) {
        return NextResponse.json(
          { error: "You are not authorized to delete this project" },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "You are not authorized to delete projects" },
        { status: 403 }
      );
    }

    // Delete the project (cascade will handle floors and quadrants)
    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({
      message: `Project "${existingProject.name}" has been deleted permanently`,
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Error deleting project" },
      { status: 500 }
    );
  }
}
