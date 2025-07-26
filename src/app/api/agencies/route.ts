import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET() {
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

    // Fetch all agencies with user and property counts
    const agencies = await prisma.agency.findMany({
      include: {
        _count: {
          select: {
            users: true,
            properties: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ agencies });
  } catch (error) {
    console.error("Failed to fetch agencies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const { name, address, phone, email } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Agency name is required" },
        { status: 400 }
      );
    }

    // Check if agency name already exists
    const existingAgency = await prisma.agency.findUnique({
      where: { name },
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
        name,
        address: address || null,
        phone: phone || null,
        email: email || null,
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

    return NextResponse.json({ agency }, { status: 201 });
  } catch (error) {
    console.error("Failed to create agency:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
