import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Get all unique locations from all properties (not just approved ones)
    // This ensures we have all possible filter options available
    
    // Get unique states
    const states = await prisma.property.findMany({
      where: {
        locationState: {
          not: "",
        },
      },
      select: {
        locationState: true,
      },
      distinct: ["locationState"],
      orderBy: {
        locationState: "asc",
      },
    });

    // Get unique cities with their states
    const cities = await prisma.property.findMany({
      where: {
        locationCity: {
          not: "",
        },
        locationState: {
          not: "",
        },
      },
      select: {
        locationCity: true,
        locationState: true,
      },
      distinct: ["locationCity", "locationState"],
      orderBy: [
        { locationState: "asc" },
        { locationCity: "asc" },
      ],
    });

    // Get unique municipalities
    const municipalities = await prisma.property.findMany({
      where: {
        municipality: {
          not: "",
        },
      },
      select: {
        municipality: true,
      },
      distinct: ["municipality"],
      orderBy: {
        municipality: "asc",
      },
    });

    // Process the results
    const statesList = states.map(s => s.locationState).filter(Boolean);
    const citiesList = cities.map(c => ({
      value: c.locationCity,
      label: `${c.locationCity}, ${c.locationState}`,
      state: c.locationState,
    })).filter(c => c.value && c.state);
    const municipalitiesList = municipalities.map(m => m.municipality).filter(Boolean);

    return NextResponse.json({
      states: statesList,
      cities: citiesList,
      municipalities: municipalitiesList,
    });
  } catch (error) {
    console.error("Error fetching property locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch property locations" },
      { status: 500 }
    );
  }
}
