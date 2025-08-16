import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Fetch profile for a specific user ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Fetch user profile from the database
    const userProfile = await prisma.user.findUnique({
      where: { userId },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!userProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT: Update profile for a specific user ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const data = await request.json();
    const { firstName, lastName, avatarUrl, active, phone } = data;

    // Update user profile in the database
    const updatedUser = await prisma.user.update({
      where: { userId },
      data: {
        firstName,
        lastName,
        avatarUrl,
        active,
        phone,
      },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
