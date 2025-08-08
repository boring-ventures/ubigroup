import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { createFloorSchema } from "@/lib/validations/project";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if project exists and user has permission
    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check permissions based on user role
    if (userProfile.role === "AGENT" && project.agentId !== userProfile.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (
      userProfile.role === "AGENCY_ADMIN" &&
      project.agencyId !== userProfile.agencyId
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const floors = await prisma.floor.findMany({
      where: { projectId: params.id },
      include: {
        quadrants: {
          orderBy: { customId: "asc" },
        },
      },
      orderBy: { number: "asc" },
    });

    return NextResponse.json(floors);
  } catch (error) {
    console.error("Error fetching floors:", error);
    return NextResponse.json(
      { error: "Failed to fetch floors" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if project exists and user has permission
    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Only the agent who created the project can add floors
    if (project.agentId !== userProfile.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createFloorSchema.parse(body);

    // Check if floor number already exists for this project
    const existingFloor = await prisma.floor.findFirst({
      where: {
        projectId: params.id,
        number: validatedData.number,
      },
    });

    if (existingFloor) {
      return NextResponse.json(
        { error: "Floor number already exists for this project" },
        { status: 400 }
      );
    }

    const floor = await prisma.floor.create({
      data: {
        ...validatedData,
        projectId: params.id,
      },
      include: {
        quadrants: {
          orderBy: { customId: "asc" },
        },
      },
    });

    return NextResponse.json(floor, { status: 201 });
  } catch (error) {
    console.error("Error creating floor:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create floor" },
      { status: 500 }
    );
  }
}
