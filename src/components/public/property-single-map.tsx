"use client";

import { useEffect, useRef } from "react";
import { getPropertyPinColor } from "@/lib/utils";
import { TransactionType } from "@prisma/client";

interface Property {
  id: string;
  customId?: string;
  title: string;
  description: string;
  type: "HOUSE" | "APARTMENT" | "OFFICE" | "LAND";
  locationState: string;
  locationCity: string;
  locationNeigh: string;
  municipality?: string;
  address?: string;
  googleMapsUrl?: string;
  latitude?: number;
  longitude?: number;
  price: number;
  currency: string;
  exchangeRate?: number;
  bedrooms: number;
  bathrooms: number;
  garageSpaces: number;
  squareMeters: number;
  transactionType: "SALE" | "RENT" | "ANTICRÉTICO";
  status: "PENDING" | "APPROVED" | "REJECTED";
  images: string[];
  videos: string[];
  features: string[];
  agent: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    whatsapp?: string;
  };
  agency: {
    name: string;
    logoUrl?: string;
  };
}

interface PropertySingleMapProps {
  property: Property;
  className?: string;
}

export function PropertySingleMap({
  property,
  className,
}: PropertySingleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  // Generate mock coordinates if not available
  const getLocationCoordinates = (city: string, neighborhood: string) => {
    if (property.latitude && property.longitude) {
      return { lat: property.latitude, lng: property.longitude };
    }

    // Generate mock coordinates based on location (for demonstration)
    const cityHash = city.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    const neighHash = neighborhood
      .split("")
      .reduce((a, b) => a + b.charCodeAt(0), 0);

    // Generate consistent coordinates based on city and neighborhood
    const lat = -16.5 + (cityHash % 100) / 1000; // Bolivia latitude range
    const lng = -68.1 + (neighHash % 100) / 1000; // Bolivia longitude range

    return { lat, lng };
  };

  useEffect(() => {
    // Only load Leaflet on client side
    const loadMap = async () => {
      if (typeof window === "undefined" || !mapRef.current) return;

      try {
        // Dynamically import Leaflet
        const L = await import("leaflet");

        // Clear existing marker first
        if (markerRef.current) {
          markerRef.current.remove();
          markerRef.current = null;
        }

        // Clear existing map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          isInitializedRef.current = false;
        }

        // Check if container is already initialized
        if ((mapRef.current as any)._leaflet_id) {
          console.warn("Map container already initialized, skipping...");
          return;
        }

        // Small delay to ensure DOM is clean
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Get coordinates
        const coords = getLocationCoordinates(
          property.locationCity,
          property.locationNeigh
        );

        // Create map instance centered on the property
        const map = L.map(mapRef.current).setView([coords.lat, coords.lng], 15);
        console.log("Single property map created successfully");

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(map);
        console.log("Tiles added to map");

        // Add custom CSS to fix zoom controls styling
        const style = document.createElement("style");
        style.textContent = `
          .leaflet-control-zoom {
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
          }
          .leaflet-control-zoom a {
            background: white !important;
            border: 1px solid #ccc !important;
            border-radius: 4px !important;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
            color: #333 !important;
            font-weight: bold !important;
            width: 30px !important;
            height: 30px !important;
            line-height: 30px !important;
            text-align: center !important;
            text-decoration: none !important;
            margin-bottom: 5px !important;
          }
          .leaflet-control-zoom a:hover {
            background: #f8f9fa !important;
            border-color: #999 !important;
          }
          .leaflet-control-zoom a:active {
            background: #e9ecef !important;
          }
          .leaflet-control-zoom-in {
            border-radius: 4px 4px 0 0 !important;
            margin-bottom: 1px !important;
          }
          .leaflet-control-zoom-out {
            border-radius: 0 0 4px 4px !important;
            margin-bottom: 0 !important;
          }
          .leaflet-control-zoom a.leaflet-disabled {
            background: #f5f5f5 !important;
            color: #ccc !important;
            cursor: not-allowed !important;
          }
        `;
        document.head.appendChild(style);

        const pinColor = getPropertyPinColor(property.transactionType);

        // Create custom icon
        const customIcon = L.divIcon({
          className: "custom-marker",
          html: `
            <div style="
              width: 24px;
              height: 24px;
              background-color: ${pinColor};
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: bold;
              color: white;
              text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
            ">
              ${
                property.transactionType === TransactionType.SALE
                  ? "V"
                  : property.transactionType === TransactionType.RENT
                    ? "A"
                    : "C"
              }
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        // Create popup content
        const popupContent = `
          <div style="min-width: 250px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">
              ${property.title}
            </h3>
            <p style="margin: 0 0 4px 0; font-size: 13px; color: #666;">
              ${property.locationNeigh}, ${property.locationCity}, ${property.locationState}
            </p>
            ${property.address ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${property.address}</p>` : ""}
            <p style="margin: 0 0 4px 0; font-size: 13px;">
              <strong>Preço:</strong> ${property.currency === "DOLLARS" ? "$" : "Bs."} ${property.price.toLocaleString()}
            </p>
            <p style="margin: 0 0 4px 0; font-size: 13px;">
              <strong>Tipo:</strong> ${property.transactionType === "SALE" ? "Venda" : property.transactionType === "RENT" ? "Aluguel" : "Anticrético"}
            </p>
            <p style="margin: 0 0 4px 0; font-size: 13px;">
              <strong>Detalhes:</strong> ${property.bedrooms} quartos, ${property.bathrooms} banheiros, ${property.squareMeters}m²
            </p>
            ${property.customId ? `<p style="margin: 0; font-size: 11px; color: #999;">ID: ${property.customId}</p>` : ""}
          </div>
        `;

        // Add marker to map
        const marker = L.marker([coords.lat, coords.lng], {
          icon: customIcon,
        })
          .addTo(map)
          .bindPopup(popupContent);

        console.log(
          `Marker added for property: ${property.title} at [${coords.lat}, ${coords.lng}]`
        );
        markerRef.current = marker;

        mapInstanceRef.current = map;
        isInitializedRef.current = true;
      } catch (error) {
        console.error("Error loading map:", error);
      }
    };

    // Use a timeout to ensure the component is fully mounted
    const timeoutId = setTimeout(() => {
      loadMap();
    }, 100);

    // Cleanup on unmount
    return () => {
      clearTimeout(timeoutId);

      // Clear marker
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }

      // Clear map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [property]);

  return (
    <div className={className}>
      <div
        ref={mapRef}
        className="w-full h-96 rounded-lg border"
        style={{ minHeight: "400px" }}
      />
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
          <span>Venda</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white shadow-sm"></div>
          <span>Aluguel</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
          <span>Anticrético</span>
        </div>
      </div>
    </div>
  );
}
