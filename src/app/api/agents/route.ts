import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { authenticateUser } from "@/lib/auth/server-auth";
import { validateRequestBody, validateQueryParams } from "@/lib/auth/rbac";
import {
  createAgentSchema,
  userQuerySchema,
  CreateAgentInput,
  UserQueryInput,
} from "@/lib/validations/user";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET - Fetch agents for Agency Admin
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error: authError } = await authenticateUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || "Unauthorized" },
        { status: 401 }
      );
    }

    // Only Agency Admins and Super Admins can access this endpoint
    if (
      user.role !== UserRole.AGENCY_ADMIN &&
      user.role !== UserRole.SUPER_ADMIN
    ) {
      return NextResponse.json(
        {
          error: "Only Agency Admins and Super Admins can access this endpoint",
        },
        { status: 403 }
      );
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const { data: queryParams, error: validationError } =
      validateQueryParams<UserQueryInput>(userQuerySchema, searchParams);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (!queryParams) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    // Build where clause
    const whereClause: {
      role: UserRole;
      agencyId?: string | null;
      active?: boolean;
      OR?: Array<{
        firstName?: { contains: string; mode: "insensitive" };
        lastName?: { contains: string; mode: "insensitive" };
      }>;
    } = {
      role: UserRole.AGENT, // Only agents
    };

    // Agency Admin can only see agents from their agency
    if (user.role === UserRole.AGENCY_ADMIN) {
      whereClause.agencyId = user.agencyId;
    }

    // Super Admin can filter by agency if specified
    if (user.role === UserRole.SUPER_ADMIN && queryParams.agencyId) {
      whereClause.agencyId = queryParams.agencyId;
    }

    // Apply additional filters
    if (queryParams.active !== undefined) {
      whereClause.active = queryParams.active;
    }

    if (queryParams.search) {
      whereClause.OR = [
        { firstName: { contains: queryParams.search, mode: "insensitive" } },
        { lastName: { contains: queryParams.search, mode: "insensitive" } },
      ];
    }

    // Fetch agents with pagination
    const [agents, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          agency: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
            },
          },
          _count: {
            select: {
              properties: true,
            },
          },
        },
        orderBy: {
          [queryParams.sortBy]: queryParams.sortOrder,
        },
        take: queryParams.limit,
        skip: queryParams.offset,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      agents,
      totalCount,
      hasMore: queryParams.offset + queryParams.limit < totalCount,
      pagination: {
        limit: queryParams.limit,
        offset: queryParams.offset,
        page: Math.floor(queryParams.offset / queryParams.limit) + 1,
        totalPages: Math.ceil(totalCount / queryParams.limit),
      },
    });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { error: "Error fetching agents" },
      { status: 500 }
    );
  }
}

// POST - Create new agent (Agency Admins only)
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error: authError } = await authenticateUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || "Unauthorized" },
        { status: 401 }
      );
    }

    // Only Agency Admins can create agents in their agency
    if (user.role !== UserRole.AGENCY_ADMIN) {
      return NextResponse.json(
        { error: "Only Agency Admins can create agents" },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const { data: agentData, error: validationError } =
      validateRequestBody<CreateAgentInput>(createAgentSchema, body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (!agentData) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        userId: agentData.email, // Temporary check during development
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    try {
      // Try to create actual Supabase auth user using admin client
      const { data: authUser, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: agentData.email,
          password: agentData.password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            firstName: agentData.firstName,
            lastName: agentData.lastName,
            role: UserRole.AGENT,
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

      // Create user profile in database
      const newAgent = await prisma.user.create({
        data: {
          userId: authUser.user.id, // Use the actual Supabase auth user ID
          firstName: agentData.firstName,
          lastName: agentData.lastName,
          role: UserRole.AGENT,
          phone: agentData.phone || null,
          whatsapp: agentData.whatsapp || null,
          agencyId: user.agencyId!, // Agent belongs to the Agency Admin's agency
          active: true,
        },
        include: {
          agency: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
            },
          },
          _count: {
            select: {
              properties: true,
            },
          },
        },
      });

      return NextResponse.json(
        {
          agent: newAgent,
          message:
            "Agent created successfully with full access. Agent can now login immediately.",
          authUserId: authUser.user.id,
        },
        { status: 201 }
      );
    } catch (adminError) {
      console.error("Admin client error:", adminError);

      // Fallback to temporary approach if admin client fails
      console.log("Falling back to temporary agent creation approach...");

      const tempAgent = await prisma.user.create({
        data: {
          userId: agentData.email, // Use email as temporary userId
          firstName: agentData.firstName,
          lastName: agentData.lastName,
          role: UserRole.AGENT,
          phone: agentData.phone || null,
          whatsapp: agentData.whatsapp || null,
          agencyId: user.agencyId!,
          active: true,
        },
        include: {
          agency: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
            },
          },
          _count: {
            select: {
              properties: true,
            },
          },
        },
      });

      return NextResponse.json(
        {
          agent: tempAgent,
          message:
            "Agent profile created. Agent needs to complete signup at /sign-up to enable login.",
          email: agentData.email,
          password: agentData.password,
          requiresSignup: true,
          signupInstructions: `Agent must go to /sign-up with email: ${agentData.email} and password: ${agentData.password}`,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Error creating agent:", error);
    return NextResponse.json(
      { error: "Error creating agent" },
      { status: 500 }
    );
  }
}
