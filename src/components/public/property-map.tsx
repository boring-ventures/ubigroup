"use client";
import "leaflet/dist/leaflet.css";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPropertyPinColor, isValidCoordinates } from "@/lib/utils";
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
  };
  agency: {
    name: string;
    logoUrl?: string;
  };
}

interface ProjectPin {
  id: string;
  name: string;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface PropertyMapProps {
  properties: Property[];
  projects?: ProjectPin[];
  className?: string;
}

export function PropertyMap({
  properties,
  projects = [],
  className,
}: PropertyMapProps) {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const isInitializedRef = useRef(false);
  const cssInjectedRef = useRef(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const isCancelledRef = useRef(false);
  const switchedToFallbackRef = useRef(false);
  const [isVisible, setIsVisible] = useState(false);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);


  // Observe visibility to initialize only when in viewport
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Initialize map only once
  useEffect(() => {
    if (!isVisible) return;
    if (isInitializedRef.current) return; // Don't reinitialize if already done

    // Capture the current map ref value to avoid the React hooks warning
    const currentMapRef = mapRef.current;

    // Reset cancellation and fallback flags
    isCancelledRef.current = false;
    switchedToFallbackRef.current = false;

    // Only load Leaflet on client side
    const initializeMap = async () => {
      if (typeof window === "undefined" || !mapRef.current) return;

      try {
        setMapError(null);

        // Dynamically import Leaflet
        const L = await import("leaflet");
        leafletRef.current = L;

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

        if (isCancelledRef.current) return;

        // Check if container already has a map instance
        const containerWithLeaflet = mapRef.current as HTMLDivElement & {
          _leaflet_id?: number;
        };
        if (containerWithLeaflet._leaflet_id) {
          try {
            delete containerWithLeaflet._leaflet_id;
          } catch {}
        }

        // Small delay to ensure DOM is clean and ready
        await new Promise((resolve) => setTimeout(resolve, 200));
        if (isCancelledRef.current || !mapRef.current) return;

        // If container has no size (hidden), delay until it has layout
        const hasSize = () => {
          const el = mapRef.current!;
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        };
        if (!hasSize()) {
          // try longer before giving up (up to ~3s)
          for (
            let i = 0;
            i < 20 && !hasSize() && !isCancelledRef.current;
            i++
          ) {
            await new Promise((r) => setTimeout(r, 150));
          }
          if (!hasSize() || isCancelledRef.current) return;
        }

        // Create map instance
        const map = L.map(mapRef.current).setView([-17.3895, -66.1568], 10); // Default to Cochabamba, Bolivia
        console.log("Map created successfully");

        // Use internal proxy tiles (matches single property page behavior)
        const primaryTiles = L.tileLayer("/api/tiles/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          crossOrigin: true,
        }).addTo(map);

        primaryTiles.on("tileerror", () => {
          try {
            if (switchedToFallbackRef.current) return;
            switchedToFallbackRef.current = true;
            map.removeLayer(primaryTiles);
            const fallback = L.tileLayer(
              "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
              {
                subdomains: "abc",
                attribution: "© OpenStreetMap contributors",
                crossOrigin: true,
              }
            );
            fallback.addTo(map);
          } catch {}
        });
        console.log("Tiles added to map");

        // Force map to refresh after a short delay to ensure proper rendering
        const timeouts: NodeJS.Timeout[] = [];
        timeouts.push(
          setTimeout(() => {
            try {
              if (
                !isCancelledRef.current &&
                mapInstanceRef.current &&
                map.getContainer()
              ) {
                map.invalidateSize();
              }
            } catch {}
          }, 200)
        );
        timeouts.push(
          setTimeout(() => {
            try {
              if (
                !isCancelledRef.current &&
                mapInstanceRef.current &&
                map.getContainer()
              ) {
                map.invalidateSize();
              }
            } catch {}
          }, 800)
        );
        timeouts.push(
          setTimeout(() => {
            try {
              if (
                !isCancelledRef.current &&
                mapInstanceRef.current &&
                map.getContainer()
              ) {
                map.invalidateSize();
              }
            } catch {}
          }, 1500)
        );

        // Store timeouts for cleanup
        (
          map as unknown as { _customTimeouts?: NodeJS.Timeout[] }
        )._customTimeouts = timeouts;

        // Observe container resize and invalidate map size
        if (mapRef.current && typeof ResizeObserver !== "undefined") {
          const ro = new ResizeObserver(() => {
            try {
              if (
                !isCancelledRef.current &&
                mapInstanceRef.current &&
                map.getContainer()
              ) {
                map.invalidateSize();
              }
            } catch {}
          });
          ro.observe(mapRef.current);
          resizeObserverRef.current = ro;
        }

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

        // Store map reference - markers will be added separately
        mapInstanceRef.current = map;
        isInitializedRef.current = true;
      } catch (error) {
        console.error("Error loading map:", error);
        setMapError("No se pudo cargar el mapa. Por favor, recarga la página.");
      }
    };

    // Use a timeout to ensure the component is fully mounted
    const timeoutId = setTimeout(() => {
      if (!isCancelledRef.current) initializeMap();
    }, 100);

    // Cleanup on unmount
    return () => {
      clearTimeout(timeoutId);
      isCancelledRef.current = true;

      // Clear all pending timeouts
      if (mapInstanceRef.current) {
        const customTimeouts = (
          mapInstanceRef.current as unknown as {
            _customTimeouts?: NodeJS.Timeout[];
          }
        )._customTimeouts;
        if (customTimeouts) {
          customTimeouts.forEach((t) => clearTimeout(t));
        }
      }

      // Disconnect resize observer first
      if (resizeObserverRef.current) {
        try {
          resizeObserverRef.current.disconnect();
        } catch (e) {
          console.warn(
            "Error disconnecting resize observer during cleanup:",
            e
          );
        }
        resizeObserverRef.current = null;
      }

      // Clear markers
      if (markersRef.current.length > 0) {
        markersRef.current.forEach((marker) => {
          if (marker && marker.remove) {
            try {
              marker.remove();
            } catch (e) {
              console.warn("Error removing marker during cleanup:", e);
            }
          }
        });
        markersRef.current = [];
      }

      // Clear map - stop any ongoing animations first
      if (mapInstanceRef.current) {
        try {
          // Stop any ongoing animations/transitions
          mapInstanceRef.current.stop();

          // Remove the map instance
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn("Error removing map during cleanup:", e);
        }
        mapInstanceRef.current = null;
        isInitializedRef.current = false;
      }

      // Clear any remaining leaflet ID from the container
      if (currentMapRef) {
        const containerWithLeaflet = currentMapRef as HTMLDivElement & {
          _leaflet_id?: number;
        };
        if (containerWithLeaflet._leaflet_id) {
          try {
            delete containerWithLeaflet._leaflet_id;
          } catch (e) {
            console.warn("Error clearing leaflet ID during cleanup:", e);
          }
        }
      }
    };
  }, [isVisible]); // Only run once when visible

  // Update markers whenever properties or projects change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;

    if (!map || !L || !isInitializedRef.current) return;

    // Clear existing markers
    if (markersRef.current.length > 0) {
      markersRef.current.forEach((marker) => {
        try {
          marker.remove();
        } catch (e) {
          console.warn("Error removing marker:", e);
        }
      });
      markersRef.current = [];
    }

    const validProperties = properties.filter((p: Property) =>
      isValidCoordinates(p.latitude, p.longitude)
    );

    const validProjects = (projects || []).filter((p: ProjectPin) =>
      isValidCoordinates(p.latitude, p.longitude)
    );

    if (validProperties.length > 0 || validProjects.length > 0) {
      const bounds = L.latLngBounds([]);

      // Add property markers
      validProperties.forEach((property) => {
        if (!isValidCoordinates(property.latitude, property.longitude)) return;

        const pinColor = getPropertyPinColor(property.transactionType);

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

        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">
              ${property.title}
            </h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">
              ${property.address || ""}, ${property.locationCity}, ${property.locationState}
            </p>
            <p style="margin: 0 0 4px 0; font-size: 12px;">
              <strong>Precio:</strong> ${property.currency === "DOLLARS" ? "$" : "Bs."} ${property.price.toLocaleString()}
            </p>
            <p style="margin: 0 0 4px 0; font-size: 12px;">
              <strong>Tipo:</strong> ${property.transactionType === "SALE" ? "Venta" : property.transactionType === "RENT" ? "Alquiler" : "Anticrético"}
            </p>
            <p style="margin: 0 0 4px 0; font-size: 12px;">
              <strong>Detalles:</strong> ${property.bedrooms} dormitorios, ${property.bathrooms} baños, ${property.squareMeters}m²
            </p>
            ${property.customId ? `<p style="margin: 0; font-size: 11px; color: #999;">ID: ${property.customId}</p>` : ""}
          </div>
        `;

        try {
          const marker = L.marker([property.latitude!, property.longitude!], {
            icon: customIcon,
          })
            .addTo(map)
            .bindTooltip(popupContent, {
              permanent: false,
              direction: "auto",
            });

          marker.on("click", () => {
            router.push(`/property/${property.id}`);
          });

          marker.on("mouseover", () => {
            marker.openTooltip();
          });

          marker.on("mouseout", () => {
            marker.closeTooltip();
          });

          markersRef.current.push(marker);
          bounds.extend([property.latitude!, property.longitude!]);
        } catch (e) {
          console.warn(`Error adding marker for property ${property.title}:`, e);
        }
      });

      // Add project markers
      validProjects.forEach((project) => {
        if (!isValidCoordinates(project.latitude, project.longitude)) return;

        const projectIcon = L.divIcon({
          className: "custom-marker",
          html: `
            <div style="
              width: 20px;
              height: 20px;
              background-color: #7c3aed;
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
              P
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">
              ${project.name}
            </h3>
            ${project.location ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${project.location}</p>` : ""}
          </div>
        `;

        try {
          const marker = L.marker([project.latitude!, project.longitude!], {
            icon: projectIcon,
          })
            .addTo(map)
            .bindTooltip(popupContent, {
              permanent: false,
              direction: "auto",
            });

          marker.on("click", () => {
            router.push(`/project/${project.id}`);
          });

          marker.on("mouseover", () => {
            marker.openTooltip();
          });

          marker.on("mouseout", () => {
            marker.closeTooltip();
          });

          markersRef.current.push(marker);
          bounds.extend([project.latitude!, project.longitude!]);
        } catch (e) {
          console.warn(`Error adding marker for project ${project.name}:`, e);
        }
      });

      // Fit map to show all markers
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [properties, projects, router]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Mapa</CardTitle>
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
                Recargar
              </button>
            </div>
          </div>
        ) : (
          <div
            ref={mapRef}
            className="w-full h-96 rounded-lg border"
            data-map-container
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
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-600 border-2 border-white shadow-sm"></div>
            <span>Proyectos</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
