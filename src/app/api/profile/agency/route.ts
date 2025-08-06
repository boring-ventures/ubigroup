import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Agency profile update schema (for Agency Admins updating their own agency)
const agencyProfileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, "Agency name must be at least 2 characters")
    .max(100, "Agency name must be less than 100 characters")
    .optional(),
  logoUrl: z.string().optional().nullable(),
  address: z
    .string()
    .min(10, "Address must be at least 10 characters")
    .max(200, "Address must be less than 200 characters")
    .optional()
    .nullable(),
  phone: z
    .string()
    .min(10, "Phone must be at least 10 characters")
    .max(20, "Phone must be less than 20 characters")
    .optional()
    .nullable(),
});

// GET - Fetch agency profile for the current Agency Admin
export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get current user to verify they're an Agency Admin
    const currentUser = await prisma.user.findUnique({
      where: { userId: user.id },
      include: { agency: true },
    });

    if (!currentUser || currentUser.role !== "AGENCY_ADMIN") {
      return NextResponse.json(
        {
          error: "Only Agency Admins can access agency profile",
        },
        { status: 403 }
      );
    }

    if (!currentUser.agency) {
      return NextResponse.json(
        {
          error: "No agency associated with this account",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ agency: currentUser.agency });
  } catch (error) {
    console.error("Failed to fetch agency profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update agency profile for the current Agency Admin
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get current user to verify they're an Agency Admin
    const currentUser = await prisma.user.findUnique({
      where: { userId: user.id },
      include: { agency: true },
    });

    if (!currentUser || currentUser.role !== "AGENCY_ADMIN") {
      return NextResponse.json(
        {
          error: "Only Agency Admins can update agency profile",
        },
        { status: 403 }
      );
    }

    if (!currentUser.agency) {
      return NextResponse.json(
        {
          error: "No agency associated with this account",
        },
        { status: 404 }
      );
    }

    // Validate request body
    const body = await request.json();

    const validationResult = agencyProfileUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { name, logoUrl, address, phone } = validationResult.data;

    // Check if name already exists (if changing name)
    if (name && name !== currentUser.agency.name) {
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

    // Prepare update data (only include defined fields)
    const updateData: {
      name?: string;
      logoUrl?: string | null;
      address?: string | null;
      phone?: string | null;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;

    // Update agency
    const updatedAgency = await prisma.agency.update({
      where: { id: currentUser.agency.id },
      data: updateData,
    });

    return NextResponse.json({
      agency: updatedAgency,
      message: "Agency profile updated successfully",
    });
  } catch (error) {
    console.error("Failed to update agency profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
