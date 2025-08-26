import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
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
      where: { id },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: {
      active?: boolean;
      name?: string;
      address?: string;
      phone?: string;
    } = {};

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
      where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
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
      where: { id },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
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

    // Find the agency to delete with all related data
    const agency = await prisma.agency.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            properties: true,
            projects: {
              include: {
                floors: {
                  include: {
                    quadrants: true,
                  },
                },
              },
            },
          },
        },
        properties: true,
        projects: {
          include: {
            floors: {
              include: {
                quadrants: true,
              },
            },
          },
        },
        _count: {
          select: {
            users: true,
            properties: true,
            projects: true,
          },
        },
      },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    // Initialize Supabase client for storage operations
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Collect all image URLs to delete from storage
    const imageUrlsToDelete: string[] = [];

    // Collect images from agency properties
    agency.properties.forEach((property) => {
      if (property.images && Array.isArray(property.images)) {
        property.images.forEach((imageUrl) => {
          if (imageUrl) {
            imageUrlsToDelete.push(imageUrl);
          }
        });
      }
    });

    // Collect images from user properties (if any users have properties)
    agency.users.forEach((user) => {
      user.properties.forEach((property) => {
        if (property.images && Array.isArray(property.images)) {
          property.images.forEach((imageUrl) => {
            if (imageUrl) {
              imageUrlsToDelete.push(imageUrl);
            }
          });
        }
      });
    });

    // Collect images from agency projects
    agency.projects.forEach((project) => {
      if (project.images && Array.isArray(project.images)) {
        project.images.forEach((imageUrl) => {
          if (imageUrl) {
            imageUrlsToDelete.push(imageUrl);
          }
        });
      }
    });

    // Delete images from Supabase storage
    if (imageUrlsToDelete.length > 0) {
      try {
        // Extract file paths from URLs
        const filePaths = imageUrlsToDelete.map((url) => {
          const urlParts = url.split("/");
          const fileName = urlParts[urlParts.length - 1];
          return `properties/${fileName}`;
        });

        // Delete files from storage
        const { error: storageError } = await supabaseClient.storage
          .from("images")
          .remove(filePaths);

        if (storageError) {
          console.error("Error deleting images from storage:", storageError);
          // Continue with deletion even if storage cleanup fails
        }
      } catch (storageError) {
        console.error("Failed to delete images from storage:", storageError);
        // Continue with deletion even if storage cleanup fails
      }
    }

    // Use a more robust deletion approach
    console.log("Starting deletion for agency:", id);

    // First, delete all users from Supabase Auth
    console.log("Deleting users from Supabase Auth...");
    for (const user of agency.users) {
      try {
        if (user.userId && user.userId !== user.id) {
          // Skip temporary users
          await supabaseAdmin.auth.admin.deleteUser(user.userId);
          console.log(
            `Successfully deleted user ${user.userId} from Supabase Auth`
          );
        }
      } catch (authDeleteError) {
        console.warn(
          `Failed to delete user ${user.userId} from Supabase Auth:`,
          authDeleteError
        );
        // Continue with other users even if one fails
      }
    }

    try {
      // Use a transaction to ensure all deletions happen atomically
      await prisma.$transaction(async (tx) => {
        // First, delete all properties owned by this agency
        console.log("Deleting properties...");
        await tx.property.deleteMany({
          where: {
            agencyId: id,
          },
        });

        // Delete all projects owned by this agency (this will cascade delete floors and quadrants)
        console.log("Deleting projects...");
        await tx.project.deleteMany({
          where: {
            agencyId: id,
          },
        });

        // Delete all users associated with this agency
        console.log("Deleting users from database...");
        await tx.user.deleteMany({
          where: {
            agencyId: id,
          },
        });

        // Finally delete the agency
        console.log("Deleting agency...");
        await tx.agency.delete({
          where: { id },
        });
      });

      console.log("Deletion completed successfully");
    } catch (deletionError) {
      console.error("Deletion error:", deletionError);
      throw deletionError;
    }

    return NextResponse.json({
      message: `Agency "${agency.name}" and all associated data (${agency._count.users} users, ${agency._count.properties} properties, ${agency._count.projects} projects) deleted successfully from both database and authentication system`,
    });
  } catch (error) {
    console.error("Failed to delete agency:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
