import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const landingImages = await prisma.landingImage.findMany({
      where: {
        status: "ACTIVE",
        active: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const response = NextResponse.json(landingImages);

    // Add caching headers for better performance
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );

    return response;
  } catch (error) {
    console.error("Error fetching public landing images:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
