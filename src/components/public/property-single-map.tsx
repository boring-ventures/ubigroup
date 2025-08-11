"use client";

import React, {
  useEffect,
  useImperativeHandle,
  useRef,
  forwardRef,
} from "react";
import type { Map, Marker } from "leaflet";
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
  onViewChange?: (view: {
    centerLat: number;
    centerLng: number;
    zoom: number;
  }) => void;
}

export type PropertySingleMapHandle = {
  awaitReady: () => Promise<void>;
  getSnapshot: () => Promise<string | null>;
};

export const PropertySingleMap = forwardRef<
  PropertySingleMapHandle,
  PropertySingleMapProps
>(function PropertySingleMap(
  { property, className, onViewChange }: PropertySingleMapProps,
  ref
): React.ReactElement {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const isInitializedRef = useRef(false);
  const cssInjectedRef = useRef(false);
  const lastViewRef = useRef<{ lat: number; lng: number; zoom: number } | null>(
    null
  );
  const readyPromiseRef = useRef<Promise<void> | null>(null);
  const resolveReadyRef = useRef<(() => void) | null>(null);

  useEffect(() => {
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

    // Only load Leaflet on client side
    // Only load Leaflet on client side
    const loadMap = async () => {
      if (typeof window === "undefined" || !mapRef.current) return;

      // If already initialized, just fix size and exit (prevents re-init loops)
      if (isInitializedRef.current && mapInstanceRef.current) {
        setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100);
        return;
      }

      try {
        // Dynamically import Leaflet
        const L = await import("leaflet");

        // Inject Leaflet CSS once to ensure tiles/controls are visible
        if (!cssInjectedRef.current && typeof document !== "undefined") {
          const existing = Array.from(
            document.querySelectorAll('link[rel="stylesheet"]')
          ).some((l) => (l as HTMLLinkElement).href.includes("leaflet.css"));
          if (!existing) {
            const linkEl = document.createElement("link");
            linkEl.rel = "stylesheet";
            linkEl.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            linkEl.integrity =
              "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
            linkEl.crossOrigin = "";
            document.head.appendChild(linkEl);
          }
          cssInjectedRef.current = true;
        }

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
        if (
          (mapRef.current as HTMLDivElement & { _leaflet_id?: number })
            ._leaflet_id
        ) {
          console.warn("Map container already initialized, skipping...");
          return;
        }

        // Small delay to ensure DOM is clean
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Prepare ready promise (resolve after tiles load)
        readyPromiseRef.current = new Promise<void>((resolve) => {
          resolveReadyRef.current = resolve;
        });

        // Get coordinates
        const coords = getLocationCoordinates(
          property.locationCity,
          property.locationNeigh
        );

        // Create map instance centered on the property
        const map = L.map(mapRef.current).setView([coords.lat, coords.lng], 15);
        // Map created

        // Add OpenStreetMap tiles
        const tiles = L.tileLayer("/api/tiles/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(map);

        tiles.on("load", () => {
          // Tiles loaded at least once
          resolveReadyRef.current?.();
        });
        // Tiles added

        // Force map to recalc size after mount
        setTimeout(() => {
          map.invalidateSize();
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
              <strong>Precio:</strong> ${property.currency === "DOLLARS" ? "$" : "Bs."} ${property.price.toLocaleString()}
            </p>
            <p style="margin: 0 0 4px 0; font-size: 13px;">
              <strong>Tipo:</strong> ${property.transactionType === "SALE" ? "Venta" : property.transactionType === "RENT" ? "Alquiler" : "Anticrético"}
            </p>
            <p style="margin: 0 0 4px 0; font-size: 13px;">
              <strong>Detalles:</strong> ${property.bedrooms} dormitorios, ${property.bathrooms} baños, ${property.squareMeters}m²
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

        // Marker added
        markerRef.current = marker;

        mapInstanceRef.current = map;
        isInitializedRef.current = true;

        // Notify initial view (only if changed)
        if (onViewChange) {
          const center = map.getCenter();
          const view = {
            lat: center.lat,
            lng: center.lng,
            zoom: map.getZoom(),
          };
          const last = lastViewRef.current;
          if (
            !last ||
            last.lat !== view.lat ||
            last.lng !== view.lng ||
            last.zoom !== view.zoom
          ) {
            lastViewRef.current = view;
            onViewChange({
              centerLat: view.lat,
              centerLng: view.lng,
              zoom: view.zoom,
            });
          }
        }

        // Listen for view changes
        map.on("moveend zoomend", () => {
          if (onViewChange) {
            const center = map.getCenter();
            const view = {
              lat: center.lat,
              lng: center.lng,
              zoom: map.getZoom(),
            };
            const last = lastViewRef.current;
            if (
              !last ||
              last.lat !== view.lat ||
              last.lng !== view.lng ||
              last.zoom !== view.zoom
            ) {
              lastViewRef.current = view;
              onViewChange({
                centerLat: view.lat,
                centerLng: view.lng,
                zoom: view.zoom,
              });
            }
          }
        });
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
  }, [
    property.id,
    property.latitude,
    property.longitude,
    property.locationCity,
    property.locationNeigh,
    property.transactionType,
  ]);

  // Expose snapshot via ref
  useImperativeHandle(ref, () => ({
    async awaitReady() {
      if (readyPromiseRef.current) {
        await readyPromiseRef.current;
      }
    },
    async getSnapshot() {
      if (!mapRef.current) return null;
      try {
        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(mapRef.current, {
          useCORS: true,
          allowTaint: false,
          backgroundColor: null,
          logging: false,
          scale: 2,
        });
        return canvas.toDataURL("image/png");
      } catch {
        return null;
      }
    },
  }));

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
    </div>
  );
});

PropertySingleMap.displayName = "PropertySingleMap";
