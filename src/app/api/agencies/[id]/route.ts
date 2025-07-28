import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });

    // Use getUser() instead of getSession() for better security
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user to check if they're a SUPER_ADMIN
    const currentUser = await prisma.user.findUnique({
      where: { userId: user.id },
    });

    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { active, name, address, phone } = body;

    // Find the agency to update
    const agency = await prisma.agency.findUnique({
      where: { id: params.id },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    if (typeof active === "boolean") {
      updateData.active = active;
    }

    if (name !== undefined) {
      // Check if name already exists (if changing name)
      if (name !== agency.name) {
        const existingAgency = await prisma.agency.findUnique({
          where: { name },
        });

        if (existingAgency) {
          return NextResponse.json(
            { error: "Agency with this name already exists" },
            { status: 400 }
          );
        }
      }
      updateData.name = name;
    }

    if (address !== undefined) {
      updateData.address = address;
    }

    if (phone !== undefined) {
      updateData.phone = phone;
    }

    // Update agency
    const updatedAgency = await prisma.agency.update({
      where: { id: params.id },
      data: updateData,
      include: {
        _count: {
          select: {
            users: true,
            properties: true,
          },
        },
      },
    });

    return NextResponse.json({ agency: updatedAgency });
  } catch (error) {
    console.error("Failed to update agency:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });

    // Use getUser() instead of getSession() for better security
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user to check if they're a SUPER_ADMIN
    const currentUser = await prisma.user.findUnique({
      where: { userId: user.id },
    });

    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find the agency
    const agency = await prisma.agency.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            users: true,
            properties: true,
          },
        },
      },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    return NextResponse.json({ agency });
  } catch (error) {
    console.error("Failed to fetch agency:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
