import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { updateFloorSchema } from "@/lib/validations/project";

export async function GET(
  _request: NextRequest,
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

    const floor = await prisma.floor.findUnique({
      where: { id },
      include: {
        quadrants: { orderBy: { customId: "asc" } },
        project: { select: { id: true, agentId: true, agencyId: true } },
      },
    });

    if (!floor) {
      return NextResponse.json({ error: "Floor not found" }, { status: 404 });
    }

    if (
      (userProfile.role === "AGENT" &&
        floor.project.agentId !== userProfile.id) ||
      (userProfile.role === "AGENCY_ADMIN" &&
        floor.project.agencyId !== userProfile.agencyId)
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(floor);
  } catch (error) {
    console.error("Error fetching floor:", error);
    return NextResponse.json(
      { error: "Failed to fetch floor" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const floor = await prisma.floor.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!floor) {
      return NextResponse.json({ error: "Floor not found" }, { status: 404 });
    }

    if (floor.project.agentId !== userProfile.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateFloorSchema.parse(body);

    // If updating number, ensure uniqueness per project
    if (validatedData.number && validatedData.number !== floor.number) {
      const conflict = await prisma.floor.findFirst({
        where: { projectId: floor.projectId, number: validatedData.number },
      });
      if (conflict) {
        return NextResponse.json(
          { error: "Floor number already exists for this project" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.floor.update({
      where: { id },
      data: validatedData,
      include: {
        quadrants: { orderBy: { customId: "asc" } },
        project: { select: { id: true, agentId: true, agencyId: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating floor:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update floor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
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

    const floor = await prisma.floor.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!floor) {
      return NextResponse.json({ error: "Floor not found" }, { status: 404 });
    }

    if (floor.project.agentId !== userProfile.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.floor.delete({ where: { id } });
    return NextResponse.json({ message: "Floor deleted successfully" });
  } catch (error) {
    console.error("Error deleting floor:", error);
    return NextResponse.json(
      { error: "Failed to delete floor" },
      { status: 500 }
    );
  }
}
