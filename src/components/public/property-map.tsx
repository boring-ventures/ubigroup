"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPropertyPinColor } from "@/lib/utils";
import { TransactionType } from "@prisma/client";
import type { Map, Marker } from "leaflet";

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

interface PropertyMapProps {
  properties: Property[];
  className?: string;
}

export function PropertyMap({ properties, className }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map>(null);
  const markersRef = useRef<Marker[]>([]);
  const isInitializedRef = useRef(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    // Only load Leaflet on client side
    const loadMap = async () => {
      if (typeof window === "undefined" || !mapRef.current) return;

      try {
        setMapError(null);

        // Dynamically import Leaflet
        const L = await import("leaflet");

        // Clear existing markers first
        if (markersRef.current.length > 0) {
          markersRef.current.forEach((marker) => {
            if (marker && marker.remove) {
              marker.remove();
            }
          });
          markersRef.current = [];
        }

        // Clear existing map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          isInitializedRef.current = false;
        }

        // Check if container is already initialized
        if (
          (mapRef.current as HTMLDivElement & { _leaflet_id?: number })
            ._leaflet_id
        ) {
          console.warn("Map container already initialized, skipping...");
          return;
        }

        // Small delay to ensure DOM is clean
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Create map instance
        const map = L.map(mapRef.current).setView([-16.5, -68.1], 10); // Default to La Paz, Bolivia
        console.log("Map created successfully");

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(map);
        console.log("Tiles added to map");

        // Force map to refresh after a short delay to ensure proper rendering
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 200);

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
          .leaflet-container {
            z-index: 1 !important;
          }
        `;
        document.head.appendChild(style);

        // Add markers for each property
        console.log("Properties received:", properties);
        console.log(
          "Properties with coordinates:",
          properties.filter((p) => p.latitude && p.longitude)
        );

        const validProperties = properties.filter(
          (p) => p.latitude && p.longitude
        );

        if (validProperties.length > 0) {
          const bounds = L.latLngBounds([]);

          validProperties.forEach((property) => {
            if (!property.latitude || !property.longitude) return;

            const pinColor = getPropertyPinColor(property.transactionType);

            // Create custom icon
            const customIcon = L.divIcon({
              className: "custom-marker",
              html: `
                <div style="
                  width: 20px;
                  height: 20px;
                  background-color: ${pinColor};
                  border: 2px solid white;
                  border-radius: 50%;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 10px;
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
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            });

            // Create popup content
            const popupContent = `
              <div style="min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">
                  ${property.title}
                </h3>
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">
                  ${property.address || ""}, ${property.locationCity}, ${property.locationState}
                </p>
                <p style="margin: 0 0 4px 0; font-size: 12px;">
                  <strong>Price:</strong> ${property.currency === "DOLLARS" ? "$" : "Bs."} ${property.price.toLocaleString()}
                </p>
                <p style="margin: 0 0 4px 0; font-size: 12px;">
                  <strong>Type:</strong> ${property.transactionType}
                </p>
                <p style="margin: 0 0 4px 0; font-size: 12px;">
                  <strong>Details:</strong> ${property.bedrooms} bed, ${property.bathrooms} bath, ${property.squareMeters}m²
                </p>
                ${property.customId ? `<p style="margin: 0; font-size: 11px; color: #999;">ID: ${property.customId}</p>` : ""}
              </div>
            `;

            // Add marker to map
            const marker = L.marker([property.latitude, property.longitude], {
              icon: customIcon,
            })
              .addTo(map)
              .bindPopup(popupContent);

            console.log(
              `Marker added for property: ${property.title} at [${property.latitude}, ${property.longitude}]`
            );
            markersRef.current.push(marker);
            bounds.extend([property.latitude, property.longitude]);
          });

          // Fit map to show all markers
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [20, 20] });
          }
        }

        mapInstanceRef.current = map;
        isInitializedRef.current = true;
      } catch (error) {
        console.error("Error loading map:", error);
        setMapError("Failed to load map. Please refresh the page.");
      }
    };

    // Use a timeout to ensure the component is fully mounted
    const timeoutId = setTimeout(() => {
      loadMap();
    }, 100);

    // Cleanup on unmount
    return () => {
      clearTimeout(timeoutId);

      // Clear markers
      if (markersRef.current.length > 0) {
        markersRef.current.forEach((marker) => {
          if (marker && marker.remove) {
            marker.remove();
          }
        });
        markersRef.current = [];
      }

      // Clear map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [properties]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Property Locations</CardTitle>
      </CardHeader>
      <CardContent>
        {mapError ? (
          <div className="w-full h-96 rounded-lg border bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 mb-2">⚠️</div>
              <p className="text-gray-600">{mapError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Refresh Page
              </button>
            </div>
          </div>
        ) : (
          <div
            ref={mapRef}
            className="w-full h-96 rounded-lg border"
            style={{
              minHeight: "400px",
              position: "relative",
              zIndex: 1,
            }}
          />
        )}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
            <span>For Sale</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white shadow-sm"></div>
            <span>For Rent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
            <span>Anticrético</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
