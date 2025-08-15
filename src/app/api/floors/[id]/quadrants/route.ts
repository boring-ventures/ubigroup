import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import {
  createQuadrantSchema,
  updateQuadrantSchema,
} from "@/lib/validations/project";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userProfile = await prisma.user.findUnique({
      where: { userId: user.id },
      include: { agency: true },
    });

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if floor exists and user has permission
    const floor = await prisma.floor.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            agentId: true,
            agencyId: true,
          },
        },
      },
    });

    if (!floor) {
      return NextResponse.json({ error: "Floor not found" }, { status: 404 });
    }

    // Check permissions based on user role
    if (
      userProfile.role === "AGENT" &&
      floor.project.agentId !== userProfile.id
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (
      userProfile.role === "AGENCY_ADMIN" &&
      floor.project.agencyId !== userProfile.agencyId
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const quadrants = await prisma.quadrant.findMany({
      where: { floorId: id },
      orderBy: { customId: "asc" },
    });

    return NextResponse.json(quadrants);
  } catch (error) {
    console.error("Error fetching quadrants:", error);
    return NextResponse.json(
      { error: "Failed to fetch quadrants" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userProfile = await prisma.user.findUnique({
      where: { userId: user.id },
      include: { agency: true },
    });

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if floor exists and user has permission
    const floor = await prisma.floor.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            agentId: true,
            agencyId: true,
          },
        },
      },
    });

    if (!floor) {
      return NextResponse.json({ error: "Floor not found" }, { status: 404 });
    }

    // Only the agent who created the project can add quadrants
    if (floor.project.agentId !== userProfile.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createQuadrantSchema.parse(body);

    // Generate custom ID for quadrant
    const quadrantCount = await prisma.quadrant.count({
      where: { floorId: id },
    });

    const customId = `Q${String(quadrantCount + 1).padStart(3, "0")}`;

    const quadrant = await prisma.quadrant.create({
      data: {
        ...validatedData,
        customId,
        floorId: id,
      },
    });

    return NextResponse.json(quadrant, { status: 201 });
  } catch (error) {
    console.error("Error creating quadrant:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create quadrant" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userProfile = await prisma.user.findUnique({
      where: { userId: user.id },
      include: { agency: true },
    });

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { quadrantId, ...updateData } = body;

    if (!quadrantId) {
      return NextResponse.json(
        { error: "Quadrant ID is required" },
        { status: 400 }
      );
    }

    // Check if quadrant exists and user has permission
    const quadrant = await prisma.quadrant.findUnique({
      where: { id: quadrantId },
      include: {
        floor: {
          include: {
            project: {
              select: {
                id: true,
                agentId: true,
                agencyId: true,
              },
            },
          },
        },
      },
    });

    if (!quadrant) {
      return NextResponse.json(
        { error: "Quadrant not found" },
        { status: 404 }
      );
    }

    // Only the agent who created the project can update quadrants
    if (quadrant.floor.project.agentId !== userProfile.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const validatedData = updateQuadrantSchema.parse(updateData);

    const updatedQuadrant = await prisma.quadrant.update({
      where: { id: quadrantId },
      data: validatedData,
    });

    return NextResponse.json(updatedQuadrant);
  } catch (error) {
    console.error("Error updating quadrant:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update quadrant" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // floor id
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userProfile = await prisma.user.findUnique({
      where: { userId: user.id },
      include: { agency: true },
    });

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { quadrantId } = body || {};
    if (!quadrantId) {
      return NextResponse.json(
        { error: "Quadrant ID is required" },
        { status: 400 }
      );
    }

    // Ensure quadrant belongs to the specified floor and user has access
    const quadrant = await prisma.quadrant.findUnique({
      where: { id: quadrantId },
      include: {
        floor: {
          include: {
            project: { select: { id: true, agentId: true, agencyId: true } },
          },
        },
      },
    });

    if (!quadrant || quadrant.floorId !== id) {
      return NextResponse.json(
        { error: "Quadrant not found" },
        { status: 404 }
      );
    }

    if (quadrant.floor.project.agentId !== userProfile.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.quadrant.delete({ where: { id: quadrantId } });
    return NextResponse.json({ message: "Quadrant deleted successfully" });
  } catch (error) {
    console.error("Error deleting quadrant:", error);
    return NextResponse.json(
      { error: "Failed to delete quadrant" },
      { status: 500 }
    );
  }
}
