import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateCustomPropertyId } from "@/lib/utils";
import {
  PropertyStatus,
  TransactionType,
  PropertyType,
  Currency,
} from "@prisma/client";

export async function POST() {
  try {
    console.log("Testing property creation with new fields...");

    // Create a test property with all new fields
    const testProperty = await prisma.property.create({
      data: {
        customId: generateCustomPropertyId(TransactionType.SALE),
        title: "Test Property with New Fields",
        description:
          "This is a test property to verify the new fields work correctly",
        type: PropertyType.APARTMENT,
        locationState: "La Paz",
        locationCity: "La Paz",
        locationNeigh: "Centro",
        municipality: "La Paz",
        address: "Av. 16 de Julio 1234",
        googleMapsUrl: "https://maps.google.com/?q=-16.5,-68.1",
        latitude: -16.5,
        longitude: -68.1,
        price: 150000,
        currency: Currency.BOLIVIANOS,
        exchangeRate: undefined,
        bedrooms: 2,
        bathrooms: 1,
        garageSpaces: 1,
        squareMeters: 80,
        transactionType: TransactionType.SALE,
        status: PropertyStatus.APPROVED,
        images: ["/test-image-1.jpg"],
        videos: [],
        features: ["Balcón", "Vista a la ciudad"],
        agentId: "test-agent-id", // This will need to be a real agent ID
        agencyId: "test-agency-id", // This will need to be a real agency ID
      },
    });

    console.log("Test property created successfully:", testProperty);

    return NextResponse.json({
      success: true,
      property: testProperty,
      message: "Test property created with new fields successfully",
    });
  } catch (error) {
    console.error("Error creating test property:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
