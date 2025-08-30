"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { TransactionType } from "@prisma/client";
import type { Map, Marker } from "leaflet";

interface Property {
  id: string;
  title: string;
  locationState: string;
  locationCity: string;
  locationNeigh: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  price: number;
  currency: string;
  transactionType: TransactionType;
  bedrooms: number;
  bathrooms: number;
  squareMeters: number;
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
  const mapInstanceRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Only load Leaflet on client side
    const loadMap = async () => {
      if (typeof window === "undefined" || !mapRef.current) return;

      // Check if property has coordinates
      if (!property.latitude || !property.longitude) {
        console.warn("Property does not have coordinates");
        return;
      }

      try {
        // Dynamically import Leaflet
        const L = await import("leaflet");

        // Clear existing marker
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
        if (
          (mapRef.current as HTMLDivElement & { _leaflet_id?: number })
            ._leaflet_id
        ) {
          console.warn("Map container already initialized, skipping...");
          return;
        }

        // Small delay to ensure DOM is clean
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Create map instance centered on the property
        const map = L.map(mapRef.current).setView(
          [property.latitude, property.longitude],
          15
        );
        console.log("Map created successfully");

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

        // Get pin color based on transaction type
        const getPinColor = (transactionType: TransactionType) => {
          switch (transactionType) {
            case "SALE":
              return "#10b981"; // green
            case "RENT":
              return "#f59e0b"; // yellow
            case "ANTICRÉTICO":
              return "#3b82f6"; // blue
            default:
              return "#6b7280"; // gray
          }
        };

        const pinColor = getPinColor(property.transactionType);

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
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1f2937;">
              ${property.title}
            </h3>
            <p style="margin: 0 0 6px 0; font-size: 13px; color: #6b7280;">
              ${property.address || ""}, ${property.locationCity}, ${property.locationState}
            </p>
            <p style="margin: 0 0 4px 0; font-size: 13px;">
              <strong>Precio:</strong> ${property.currency === "DOLLARS" ? "$" : "Bs."} ${property.price.toLocaleString()}
            </p>
            <p style="margin: 0 0 4px 0; font-size: 13px;">
              <strong>Tipo:</strong> ${property.transactionType === "SALE" ? "Venta" : property.transactionType === "RENT" ? "Alquiler" : "Anticrético"}
            </p>
            <p style="margin: 0; font-size: 13px;">
              <strong>Detalles:</strong> ${property.bedrooms} dormitorios, ${property.bathrooms} baños, ${property.squareMeters}m²
            </p>
          </div>
        `;

        // Add marker to map
        const marker = L.marker([property.latitude, property.longitude], {
          icon: customIcon,
        })
          .addTo(map)
          .bindPopup(popupContent)
          .openPopup(); // Open popup by default

        console.log(
          `Marker added for property: ${property.title} at [${property.latitude}, ${property.longitude}]`
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

  // If property doesn't have coordinates, show a message
  if (!property.latitude || !property.longitude) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Ubicación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No se han configurado las coordenadas de ubicación para esta
                propiedad.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {property.address && `Dirección: ${property.address}`}
                {property.locationNeigh && `, ${property.locationNeigh}`}
                {property.locationCity && `, ${property.locationCity}`}
                {property.locationState && `, ${property.locationState}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Ubicación
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={mapRef}
          className="w-full h-80 rounded-lg border"
          style={{ minHeight: "320px" }}
        />
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
            <span>Venta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white shadow-sm"></div>
            <span>Alquiler</span>
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
