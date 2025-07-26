import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

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

    // Fetch all users with their agency information
    const users = await prisma.user.findMany({
      include: {
        agency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

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
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      whatsapp,
      agencyId,
    } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["SUPER_ADMIN", "AGENCY_ADMIN", "AGENT"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if agency is required for non-SUPER_ADMIN roles
    if (role !== "SUPER_ADMIN" && !agencyId) {
      return NextResponse.json(
        { error: "Agency is required for non-Super Admin roles" },
        { status: 400 }
      );
    }

    // Check if agency exists (for non-SUPER_ADMIN roles)
    if (role !== "SUPER_ADMIN" && agencyId) {
      const agency = await prisma.agency.findUnique({
        where: { id: agencyId },
      });

      if (!agency) {
        return NextResponse.json(
          { error: "Agency not found" },
          { status: 404 }
        );
      }
    }

    // Check if user with this email already exists in database OR Supabase
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { userId: email }, // Old temporary approach
          // We'll also check by actual userId after creating auth user
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    try {
      // Create actual Supabase auth user using admin client
      const { data: authUser, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            firstName,
            lastName,
            role,
          },
        });

      if (authError) {
        console.error("Failed to create auth user:", authError);
        return NextResponse.json(
          { error: `Failed to create auth user: ${authError.message}` },
          { status: 500 }
        );
      }

      if (!authUser.user) {
        return NextResponse.json(
          { error: "Failed to create auth user" },
          { status: 500 }
        );
      }

      // Create user profile in database with the actual auth user ID
      const newUser = await prisma.user.create({
        data: {
          userId: authUser.user.id, // Use the actual Supabase auth user ID
          firstName,
          lastName,
          role,
          phone: phone || null,
          whatsapp: whatsapp || null,
          agencyId: role === "SUPER_ADMIN" ? null : agencyId,
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

      return NextResponse.json(
        {
          user: newUser,
          message:
            "User created successfully with full access. User can now login immediately.",
          authUserId: authUser.user.id,
          canLoginNow: true,
        },
        { status: 201 }
      );
    } catch (adminError) {
      console.error("Admin client error:", adminError);

      // Fallback to temporary approach if admin client fails
      console.log("Falling back to temporary user creation approach...");

      const tempUser = await prisma.user.create({
        data: {
          userId: email, // Use email as temporary userId
          firstName,
          lastName,
          role,
          phone: phone || null,
          whatsapp: whatsapp || null,
          agencyId: role === "SUPER_ADMIN" ? null : agencyId,
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

      return NextResponse.json(
        {
          user: tempUser,
          message:
            "User profile created. User needs to complete signup at /sign-up to enable login.",
          email,
          password,
          requiresSignup: true,
          signupInstructions: `User must go to /sign-up with email: ${email} and password: ${password}`,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
