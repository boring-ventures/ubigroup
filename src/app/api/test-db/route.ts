import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Get all properties with basic info
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        agentId: true,
        agencyId: true,
        createdAt: true,
      },
      take: 10,
    });

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        agencyId: true,
      },
      take: 10,
    });

    // Get all agencies
    const agencies = await prisma.agency.findMany({
      select: {
        id: true,
        name: true,
      },
      take: 10,
    });

    return NextResponse.json({
      properties,
      users,
      agencies,
      totalProperties: await prisma.property.count(),
      totalUsers: await prisma.user.count(),
      totalAgencies: await prisma.agency.count(),
    });
  } catch (error) {
    console.error("Error in test endpoint:", error);
    return NextResponse.json(
      { error: "Error testing database" },
      { status: 500 }
    );
  }
}
