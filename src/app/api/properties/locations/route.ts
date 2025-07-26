import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Get unique locations from approved properties
    const locations = await prisma.property.findMany({
      where: {
        status: "APPROVED",
      },
      select: {
        locationState: true,
        locationCity: true,
        locationNeigh: true,
      },
      distinct: ["locationState", "locationCity", "locationNeigh"],
    });

    // Process and organize locations
    const statesMap = new Map<string, Set<string>>();
    const citiesMap = new Map<string, Set<string>>();

    locations.forEach((location) => {
      if (location.locationState && location.locationCity) {
        // Track states and their cities
        if (!statesMap.has(location.locationState)) {
          statesMap.set(location.locationState, new Set());
        }
        statesMap.get(location.locationState)!.add(location.locationCity);

        // Track cities and their neighborhoods
        if (location.locationNeigh) {
          const cityKey = `${location.locationCity}, ${location.locationState}`;
          if (!citiesMap.has(cityKey)) {
            citiesMap.set(cityKey, new Set());
          }
          citiesMap.get(cityKey)!.add(location.locationNeigh);
        }
      }
    });

    // Convert to arrays and sort
    const states = Array.from(statesMap.keys()).sort();

    const cities = Array.from(statesMap.entries())
      .flatMap(([state, citySet]) =>
        Array.from(citySet).map((city) => ({
          value: city,
          label: `${city}, ${state}`,
          state,
        }))
      )
      .sort((a, b) => a.label.localeCompare(b.label));

    const neighborhoods = Array.from(citiesMap.entries())
      .flatMap(([cityKey, neighSet]) =>
        Array.from(neighSet).map((neigh) => ({
          value: neigh,
          label: `${neigh}, ${cityKey}`,
          city: cityKey,
        }))
      )
      .sort((a, b) => a.label.localeCompare(b.label));

    return NextResponse.json({
      states,
      cities,
      neighborhoods,
    });
  } catch (error) {
    console.error("Error fetching property locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch property locations" },
      { status: 500 }
    );
  }
}
