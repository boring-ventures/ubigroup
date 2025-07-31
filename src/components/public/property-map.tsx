"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPropertyPinColor } from "@/lib/utils";
import { TransactionType } from "@prisma/client";

interface Property {
  id: string;
  customId?: string;
  title: string;
  address: string;
  city: string;
  state: string;
  municipality?: string;
  price: number;
  currency: string;
  transactionType: TransactionType;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  squareMeters: number;
  images: string[];
}

interface PropertyMapProps {
  properties: Property[];
  className?: string;
}

export function PropertyMap({ properties, className }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Only load Leaflet on client side
    const loadMap = async () => {
      if (typeof window === "undefined" || !mapRef.current) return;

      try {
        // Dynamically import Leaflet
        const L = await import("leaflet");
        await import("leaflet/dist/leaflet.css");

        // Clear existing map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        // Create map instance
        const map = L.map(mapRef.current).setView([-16.5, -68.1], 10); // Default to La Paz, Bolivia

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(map);

        // Add markers for each property
        properties.forEach((property) => {
          if (property.latitude && property.longitude) {
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
                  ${property.address}, ${property.city}, ${property.state}
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

            // Fit map to show all markers
            const bounds = L.latLngBounds(
              properties
                .filter((p) => p.latitude && p.longitude)
                .map((p) => [p.latitude!, p.longitude!])
            );

            if (bounds.isValid()) {
              map.fitBounds(bounds, { padding: [20, 20] });
            }
          }
        });

        mapInstanceRef.current = map;
      } catch (error) {
        console.error("Error loading map:", error);
      }
    };

    loadMap();

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [properties]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Property Locations</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={mapRef}
          className="w-full h-96 rounded-lg border"
          style={{ minHeight: "400px" }}
        />
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
