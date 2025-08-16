import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

// GET: Fetch profile for the current authenticated user
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Use getUser() instead of getSession() for better security
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Supabase auth error:", userError);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    if (!user) {
      console.error("No user found in session");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = user.id;
    console.log("Fetching profile for user:", userId);

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
      console.error("Profile not found for user:", userId);
      // Instead of returning 404, let's try to create a basic profile
      // This handles cases where the user exists in Supabase but not in our database
      try {
        const newProfile = await prisma.user.create({
          data: {
            userId,
            firstName:
              user.user_metadata?.firstName ||
              user.email?.split("@")[0] ||
              "User",
            lastName: user.user_metadata?.lastName || "",
            role: "AGENT", // Default role
            active: true,
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
        console.log("Created new profile for user:", userId);

        // Return the profile in the expected format
        const profileResponse = {
          id: newProfile.id,
          userId: newProfile.userId,
          avatarUrl: newProfile.avatarUrl,
          createdAt: newProfile.createdAt,
          updatedAt: newProfile.updatedAt,
          active: newProfile.active,
          firstName: newProfile.firstName,
          lastName: newProfile.lastName,
          role: newProfile.role,
          phone: newProfile.phone,
          agencyId: newProfile.agencyId,
          requiresPasswordChange: newProfile.requiresPasswordChange,
          agency: newProfile.agency,
        };

        return NextResponse.json(profileResponse);
      } catch (createError) {
        console.error("Failed to create profile:", createError);
        return NextResponse.json(
          { error: "Profile not found" },
          { status: 404 }
        );
      }
    }

    // Ensure the response format matches what the frontend expects
    const profileResponse = {
      id: userProfile.id,
      userId: userProfile.userId,
      avatarUrl: userProfile.avatarUrl,
      createdAt: userProfile.createdAt,
      updatedAt: userProfile.updatedAt,
      active: userProfile.active,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      role: userProfile.role,
      phone: userProfile.phone,
      agencyId: userProfile.agencyId,
      requiresPasswordChange: userProfile.requiresPasswordChange,
      agency: userProfile.agency,
    };

    return NextResponse.json(profileResponse);
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
    const supabase = createRouteHandlerClient({ cookies });

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

      // Return the profile in the expected format
      const profileResponse = {
        id: newUser.id,
        userId: newUser.userId,
        avatarUrl: newUser.avatarUrl,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
        active: newUser.active,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        phone: newUser.phone,
        agencyId: newUser.agencyId,
        requiresPasswordChange: newUser.requiresPasswordChange,
        agency: newUser.agency,
      };

      return NextResponse.json(profileResponse, { status: 201 });
    }

    // Normal flow requiring authentication
    const supabase = createRouteHandlerClient({ cookies });

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

    // Return the profile in the expected format
    const profileResponse = {
      id: newUser.id,
      userId: newUser.userId,
      avatarUrl: newUser.avatarUrl,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
      active: newUser.active,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      phone: newUser.phone,
      agencyId: newUser.agencyId,
      requiresPasswordChange: newUser.requiresPasswordChange,
      agency: newUser.agency,
    };

    return NextResponse.json(profileResponse, { status: 201 });
  } catch (error) {
    console.error("Error creating profile:", error);
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 }
    );
  }
}
