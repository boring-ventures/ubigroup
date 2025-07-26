import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface SearchSuggestion {
  type: "location" | "property_type" | "price_range";
  value: string;
  label: string;
  category?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions: SearchSuggestion[] = [];
    const normalizedQuery = query.toLowerCase().trim();

    // Get location suggestions (states, cities, neighborhoods)
    const locationMatches = await prisma.property.findMany({
      where: {
        status: "APPROVED",
        OR: [
          {
            locationState: {
              contains: normalizedQuery,
              mode: "insensitive",
            },
          },
          {
            locationCity: {
              contains: normalizedQuery,
              mode: "insensitive",
            },
          },
          {
            locationNeigh: {
              contains: normalizedQuery,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        locationState: true,
        locationCity: true,
        locationNeigh: true,
      },
      distinct: ["locationState", "locationCity", "locationNeigh"],
      take: 20,
    });

    // Process location suggestions
    const locationSet = new Set<string>();
    locationMatches.forEach((property) => {
      if (
        property.locationState?.toLowerCase().includes(normalizedQuery) &&
        !locationSet.has(property.locationState)
      ) {
        locationSet.add(property.locationState);
        suggestions.push({
          type: "location",
          value: property.locationState,
          label: property.locationState,
          category: "Estado",
        });
      }

      if (
        property.locationCity?.toLowerCase().includes(normalizedQuery) &&
        !locationSet.has(property.locationCity)
      ) {
        locationSet.add(property.locationCity);
        suggestions.push({
          type: "location",
          value: property.locationCity,
          label: `${property.locationCity}, ${property.locationState}`,
          category: "Cidade",
        });
      }

      if (
        property.locationNeigh?.toLowerCase().includes(normalizedQuery) &&
        !locationSet.has(property.locationNeigh)
      ) {
        locationSet.add(property.locationNeigh);
        suggestions.push({
          type: "location",
          value: property.locationNeigh,
          label: `${property.locationNeigh}, ${property.locationCity}`,
          category: "Bairro",
        });
      }
    });

    // Property type suggestions
    const propertyTypes = [
      { value: "HOUSE", label: "Casa" },
      { value: "APARTMENT", label: "Apartamento" },
      { value: "OFFICE", label: "Escritório" },
      { value: "LAND", label: "Terreno" },
    ];

    propertyTypes.forEach((type) => {
      if (type.label.toLowerCase().includes(normalizedQuery)) {
        suggestions.push({
          type: "property_type",
          value: type.value,
          label: type.label,
          category: "Tipo de Imóvel",
        });
      }
    });

    // Price range suggestions (only if query contains numbers)
    if (/\d/.test(normalizedQuery)) {
      const priceRanges = [
        { min: 0, max: 200000, label: "Até R$ 200.000" },
        { min: 200000, max: 500000, label: "R$ 200.000 - R$ 500.000" },
        { min: 500000, max: 1000000, label: "R$ 500.000 - R$ 1.000.000" },
        { min: 1000000, max: 2000000, label: "R$ 1.000.000 - R$ 2.000.000" },
        { min: 2000000, max: Infinity, label: "Acima de R$ 2.000.000" },
      ];

      priceRanges.forEach((range) => {
        suggestions.push({
          type: "price_range",
          value: `${range.min}-${range.max === Infinity ? "" : range.max}`,
          label: range.label,
          category: "Faixa de Preço",
        });
      });
    }

    // Limit total suggestions and sort by relevance
    const limitedSuggestions = suggestions.slice(0, 10);

    return NextResponse.json({ suggestions: limitedSuggestions });
  } catch (error) {
    console.error("Error fetching search suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch search suggestions" },
      { status: 500 }
    );
  }
}
