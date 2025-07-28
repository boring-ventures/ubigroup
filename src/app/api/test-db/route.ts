import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("Testing database connection...");

    // Test database connection by counting agencies
    const agencyCount = await prisma.agency.count();
    console.log("Database connection successful. Agency count:", agencyCount);

    // Test user count
    const userCount = await prisma.user.count();
    console.log("User count:", userCount);

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      counts: {
        agencies: agencyCount,
        users: userCount,
      },
    });
  } catch (error) {
    console.error("Database connection test failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Database connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
