import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

// GET: Fetch profile for the current authenticated user
export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Use getUser() instead of getSession() for better security
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = user.id;

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

// PUT: Update profile for the current authenticated user
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Use getUser() instead of getSession() for better security
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = user.id;
    const data = await request.json();
    const { firstName, lastName, avatarUrl, active, phone, whatsapp } = data;

    // Update user profile in the database
    const updatedUser = await prisma.user.update({
      where: { userId },
      data: {
        firstName,
        lastName,
        avatarUrl,
        active,
        phone,
        whatsapp,
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

// POST: Create a new profile for the current authenticated user
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      userId,
      firstName,
      lastName,
      avatarUrl,
      role = "SUPER_ADMIN",
      phone,
      whatsapp,
      agencyId,
    } = data;

    // If userId is provided directly (during signup flow)
    if (userId) {
      // Check if user profile already exists
      const existingUser = await prisma.user.findUnique({
        where: { userId },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Profile already exists" },
          { status: 409 }
        );
      }

      // Create user profile in the database
      const newUser = await prisma.user.create({
        data: {
          userId,
          firstName,
          lastName,
          avatarUrl,
          active: true,
          role,
          phone: phone || null,
          whatsapp: whatsapp || null,
          agencyId: role === "SUPER_ADMIN" ? null : agencyId || null,
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

      return NextResponse.json(newUser, { status: 201 });
    }

    // Normal flow requiring authentication
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Use getUser() instead of getSession() for better security
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const authenticatedUserId = user.id;

    // Check if user profile already exists
    const existingUser = await prisma.user.findUnique({
      where: { userId: authenticatedUserId },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Profile already exists" },
        { status: 409 }
      );
    }

    // Create user profile in the database
    const newUser = await prisma.user.create({
      data: {
        userId: authenticatedUserId,
        firstName,
        lastName,
        avatarUrl,
        active: true,
        role: "SUPER_ADMIN", // Default to SUPER_ADMIN for new signups
        phone: phone || null,
        whatsapp: whatsapp || null,
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

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating profile:", error);
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 }
    );
  }
}
