import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Get all unique locations from all properties (not just approved ones)
    // This ensures we have all possible filter options available
    //
    // IMPORTANT: We normalize all values (trim + lowercase) to eliminate duplicates
    // caused by different casing or spacing, then display them properly capitalized

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
      orderBy: [{ locationState: "asc" }, { locationCity: "asc" }],
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

    // Helper function to capitalize words properly
    const capitalizeWords = (str: string) => {
      return str
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    // Process the results and deduplicate with normalization
    const statesMap = new Map();
    states
      .map((s) => s.locationState.trim().toLowerCase())
      .filter(Boolean)
      .forEach((state) => {
        statesMap.set(state, capitalizeWords(state));
      });
    const statesList = Array.from(statesMap.values());

    // Deduplicate cities by normalizing (trim + lowercase) and using Map
    const citiesMap = new Map();
    cities
      .map((c) => ({
        normalizedCity: c.locationCity.trim().toLowerCase(),
        normalizedState: c.locationState.trim().toLowerCase(),
        originalCity: c.locationCity.trim(),
        originalState: c.locationState.trim(),
      }))
      .filter((c) => c.normalizedCity && c.normalizedState)
      .forEach((city) => {
        // Use normalized city as key to avoid duplicates
        const key = city.normalizedCity;
        if (!citiesMap.has(key)) {
          citiesMap.set(key, {
            value: city.normalizedCity,
            label: `${capitalizeWords(city.originalCity)}, ${capitalizeWords(city.originalState)}`,
            state: city.normalizedState,
          });
        }
      });
    const citiesList = Array.from(citiesMap.values());

    // Deduplicate municipalities by normalizing (trim + lowercase)
    const municipalitiesMap = new Map();
    municipalities
      .map((m) => m.municipality?.trim().toLowerCase())
      .filter((municipality): municipality is string => Boolean(municipality))
      .forEach((municipality) => {
        municipalitiesMap.set(municipality, {
          value: municipality,
          label: capitalizeWords(municipality),
        });
      });
    const municipalitiesList = Array.from(municipalitiesMap.values());

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
