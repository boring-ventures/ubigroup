"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  propertyType: string;
  images: string[];
  active: boolean;
  floors?: Array<{
    id: string;
    number: number;
    name: string | null;
    quadrants?: Array<{
      id: string;
      customId: string;
      status: "AVAILABLE" | "UNAVAILABLE" | "RESERVED";
      price?: number;
      currency?: string;
      bedrooms?: number;
      bathrooms?: number;
      area?: number;
    }>;
  }>;
  latitude?: number | null;
  longitude?: number | null;
  agent?: {
    id: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    phone?: string;
    whatsapp?: string;
  };
  agency?: {
    name: string;
    logoUrl?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface ProjectPdfDownloadProps {
  project: Project;
  variant?: "header" | "sidebar";
  mapView?: { centerLat: number; centerLng: number; zoom: number } | null;
  mapSnapshotDataUrl?: string | null;
  onBeforeGenerate?: () => Promise<string | null> | string | void;
}

export function ProjectPdfDownload({
  project,
  variant = "sidebar",
  mapView,
  mapSnapshotDataUrl,
  onBeforeGenerate,
}: ProjectPdfDownloadProps) {
  const formatPrice = (price: number, currency: string = "USD") => {
    const currencySymbol = currency === "DOLLARS" ? "$" : "Bs.";
    return `${currencySymbol} ${price.toLocaleString()}`;
  };

  const getPropertyTypeLabel = (type: string) => {
    switch (type) {
      case "HOUSE":
        return "Casa";
      case "APARTMENT":
        return "Apartamento";
      case "OFFICE":
        return "Oficina";
      case "LAND":
        return "Terreno";
      default:
        return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "Disponible";
      case "UNAVAILABLE":
        return "No Disponible";
      case "RESERVED":
        return "Reservado";
      default:
        return status;
    }
  };

  // Calculate project statistics
  const totalUnits =
    project.floors?.reduce(
      (total, floor) => total + (floor.quadrants?.length || 0),
      0
    ) || 0;

  const availableUnits =
    project.floors?.reduce(
      (total, floor) =>
        total +
        (floor.quadrants?.filter((q) => q.status === "AVAILABLE").length || 0),
      0
    ) || 0;

  // Resolve coordinates and zoom
  const resolveCoordsAndZoom = () => {
    if (mapView) {
      return {
        lat: mapView.centerLat,
        lng: mapView.centerLng,
        zoom: Math.max(1, Math.min(19, Math.round(mapView.zoom))),
      };
    }
    if (project.latitude && project.longitude) {
      return {
        lat: project.latitude,
        lng: project.longitude,
        zoom: 15,
      };
    }
    // Fallback coordinates based on location string
    const locationHash = project.location
      .split("")
      .reduce((a, b) => a + b.charCodeAt(0), 0);
    const lat = -16.5 + (locationHash % 100) / 1000;
    const lng = -68.1 + (locationHash % 100) / 1000;
    return { lat, lng, zoom: 15 };
  };

  const handleDownloadPdf = async () => {
    try {
      let liveSnapshot: string | null = null;
      if (onBeforeGenerate) {
        const maybe = await onBeforeGenerate();
        if (typeof maybe === "string") {
          liveSnapshot = maybe;
        }
      }

      // Create a temporary container for PDF generation
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "fixed";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "0";
      tempContainer.style.width = "800px";
      tempContainer.style.backgroundColor = "white";
      tempContainer.style.padding = "40px";
      tempContainer.style.fontFamily = "Arial, sans-serif";
      tempContainer.style.fontSize = "14px";
      tempContainer.style.lineHeight = "1.6";
      tempContainer.style.color = "#333";
      tempContainer.style.zIndex = "-1";

      // Compute map params
      const { lat, lng, zoom } = resolveCoordsAndZoom();
      const mapWidth = 800;
      const mapHeight = 500;
      const markerSpec = `${lat},${lng},red`;
      const staticMapUrl = `/api/static-map?center=${encodeURIComponent(`${lat},${lng}`)}&zoom=${encodeURIComponent(String(zoom))}&size=${encodeURIComponent(`${mapWidth}x${mapHeight}`)}&markers=${encodeURIComponent(markerSpec)}`;

      // Preload map image and convert to data URL
      let mapDataUrl: string | null = null;
      try {
        const res = await fetch(staticMapUrl, { cache: "no-store" });
        if (res.ok) {
          const blob = await res.blob();
          mapDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        }
      } catch {}

      // Create PDF content
      const pdfContent = `
        <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 10px; color: #1f2937;">
              ${project.name}
            </h1>
            <div style="font-size: 16px; color: #6b7280; margin-bottom: 20px;">
              ${project.location}
            </div>
            <div style="font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px;">
              ${totalUnits} Unidades • ${availableUnits} Disponibles
            </div>
            <div style="font-size: 14px; color: #6b7280;">
              ${getPropertyTypeLabel(project.propertyType)} • ${project.floors?.length || 0} Pisos • ${project.active ? "Activo" : "Inactivo"}
            </div>
          </div>

          <!-- Project Images -->
          ${
            project.images && project.images.length > 0
              ? `
            <div style="margin-bottom: 30px;">
              <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1f2937;">
                Imágenes del Proyecto
              </h2>
              <div style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
              ">
                ${project.images
                  .slice(0, 6)
                  .map(
                    (image, index) => `
                  <div style="
                    aspect-ratio: 4/3;
                    background: #f3f4f6;
                    border-radius: 8px;
                    overflow: hidden;
                    position: relative;
                    border: 1px solid #e5e7eb;
                  ">
                    <img 
                      src="${image}" 
                      alt="Imagen ${index + 1} del proyecto"
                      style="
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        object-position: center;
                      "
                      onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                    />
                    <div style="
                      display: none;
                      width: 100%;
                      height: 100%;
                      align-items: center;
                      justify-content: center;
                      background: #f3f4f6;
                      color: #6b7280;
                      font-size: 12px;
                    ">
                      Imagen ${index + 1}
                    </div>
                  </div>
                `
                  )
                  .join("")}
              </div>
              ${
                project.images.length > 6
                  ? `
                <div style="
                  text-align: center;
                  font-size: 12px;
                  color: #6b7280;
                  font-style: italic;
                ">
                  +${project.images.length - 6} imágenes adicionales
                </div>
              `
                  : ""
              }
            </div>
          `
              : ""
          }

          <!-- Project Statistics -->
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1f2937;">
              Estadísticas del Proyecto
            </h2>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px;">
              <div style="text-align: center; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <div style="font-size: 18px; font-weight: bold; color: #2563eb;">${project.floors?.length || 0}</div>
                <div style="font-size: 12px; color: #6b7280;">Pisos</div>
              </div>
              <div style="text-align: center; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <div style="font-size: 18px; font-weight: bold; color: #2563eb;">${totalUnits}</div>
                <div style="font-size: 12px; color: #6b7280;">Unidades Totales</div>
              </div>
              <div style="text-align: center; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <div style="font-size: 18px; font-weight: bold; color: #10b981;">${availableUnits}</div>
                <div style="font-size: 12px; color: #6b7280;">Disponibles</div>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1f2937;">
              Descripción
            </h2>
            <p style="color: #6b7280; line-height: 1.8; white-space: pre-line;">
              ${project.description}
            </p>
          </div>

          <!-- Floors and Units -->
          ${
            project.floors && project.floors.length > 0
              ? `
            <div style="margin-bottom: 30px;">
              <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1f2937;">
                Pisos y Unidades
              </h2>
              ${project.floors
                .map(
                  (floor) => `
                <div style="margin-bottom: 20px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px;">
                  <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #1f2937;">
                    Piso ${floor.number}${floor.name ? ` - ${floor.name}` : ""}
                    <span style="font-size: 12px; color: #6b7280; font-weight: normal; margin-left: 10px;">
                      (${floor.quadrants?.length || 0} unidades)
                    </span>
                  </h3>
                  ${
                    floor.quadrants && floor.quadrants.length > 0
                      ? `
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                      ${floor.quadrants
                        .map(
                          (quadrant) => `
                        <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 10px; background: #f9fafb;">
                          <div style="font-weight: bold; margin-bottom: 5px;">
                            Unidad ${quadrant.customId}
                          </div>
                          <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">
                            Estado: ${getStatusLabel(quadrant.status)}
                          </div>
                          ${
                            quadrant.price
                              ? `
                            <div style="font-weight: bold; color: #2563eb; margin-bottom: 5px;">
                              ${formatPrice(quadrant.price, quadrant.currency || "USD")}
                            </div>
                          `
                              : ""
                          }
                          <div style="font-size: 11px; color: #6b7280;">
                            ${
                              quadrant.bedrooms !== undefined
                                ? `${quadrant.bedrooms} hab. • `
                                : ""
                            }${
                              quadrant.bathrooms !== undefined
                                ? `${quadrant.bathrooms} baños • `
                                : ""
                            }${
                              quadrant.area !== undefined
                                ? `${quadrant.area} m²`
                                : ""
                            }
                          </div>
                        </div>
                      `
                        )
                        .join("")}
                    </div>
                  `
                      : `
                    <div style="color: #6b7280; font-style: italic;">
                      No hay unidades disponibles en este piso.
                    </div>
                  `
                  }
                </div>
              `
                )
                .join("")}
            </div>
          `
              : ""
          }

          <!-- Location -->
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1f2937;">
              Ubicación
            </h2>
            <div style="color: #6b7280; line-height: 1.8; margin-bottom: 20px;">
              <div><strong>Ubicación:</strong> ${project.location}</div>
              ${project.latitude && project.longitude ? `<div><strong>Coordenadas:</strong> ${project.latitude.toFixed(4)}, ${project.longitude.toFixed(4)}</div>` : ""}
            </div>
            
            <!-- Map Section -->
            <div style="margin-top: 20px;">
              <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #1f2937;">
                Mapa de la ubicación
              </h3>
              <div style="
                width: 100%; 
                height: ${mapHeight}px; 
                border: 2px solid #d1d5db;
                border-radius: 8px;
                position: relative;
                overflow: hidden;
                background: #f3f4f6;
              ">
                <!-- Map Image -->
                <img 
                  src="${liveSnapshot ?? mapSnapshotDataUrl ?? mapDataUrl ?? staticMapUrl}"
                  alt="Mapa de la ubicación"
                  style="
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                  "
                  onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                />
                <!-- Fallback Map -->
                <div style="
                  display: none;
                  width: 100%;
                  height: 100%;
                  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
                  align-items: center;
                  justify-content: center;
                  flex-direction: column;
                  color: #6b7280;
                ">
                  <div style="font-size: 24px; margin-bottom: 8px;">🗺️</div>
                  <div style="font-size: 12px; text-align: center;">
                    Mapa de la ubicación<br/>
                    ${lat.toFixed(4)}, ${lng.toFixed(4)}
                  </div>
                </div>
                
                <!-- Location Text -->
                <div style="
                  position: absolute;
                  bottom: 20px;
                  left: 50%;
                  transform: translateX(-50%);
                  background: rgba(255,255,255,0.95);
                  padding: 8px 16px;
                  border-radius: 20px;
                  font-size: 12px;
                  font-weight: 500;
                  color: #374151;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  z-index: 10;
                ">
                  📍 ${project.location}
                </div>
                
                <!-- Coordinates -->
                <div style="
                  position: absolute;
                  top: 10px;
                  left: 10px;
                  background: rgba(255,255,255,0.9);
                  padding: 6px 12px;
                  border-radius: 6px;
                  font-size: 10px;
                  color: #6b7280;
                  font-weight: 500;
                  font-family: monospace;
                ">
                  ${lat.toFixed(4)}, ${lng.toFixed(4)}
                </div>
                
                <!-- Map Legend -->
                <div style="
                  position: absolute;
                  top: 10px;
                  right: 10px;
                  background: rgba(255,255,255,0.9);
                  padding: 6px 12px;
                  border-radius: 6px;
                  font-size: 10px;
                  color: #6b7280;
                  font-weight: 500;
                ">
                  🗺️ Mapa
                </div>
              </div>
              
              <!-- Map Note -->
              <div style="
                margin-top: 10px;
                font-size: 11px;
                color: #9ca3af;
                text-align: center;
                font-style: italic;
              ">
                Ubicación: ${lat.toFixed(4)}, ${lng.toFixed(4)} • Vista del mapa (zoom ${zoom})
              </div>
            </div>
          </div>

          <!-- Agent Information -->
          ${
            project.agent
              ? `
            <div style="margin-bottom: 30px;">
              <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1f2937;">
                Información de Contacto
              </h2>
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; background: #f9fafb;">
                <div style="margin-bottom: 15px;">
                  <div style="font-weight: bold; font-size: 16px; color: #1f2937;">
                    ${project.agent.firstName || ""} ${project.agent.lastName || ""}
                  </div>
                  <div style="color: #6b7280; font-size: 14px;">
                    ${project.agency?.name || "Agente"}
                  </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                  ${
                    project.agent.phone
                      ? `
                    <div>
                      <div style="font-weight: bold; color: #1f2937;">Teléfono:</div>
                      <div style="color: #6b7280;">${project.agent.phone}</div>
                    </div>
                  `
                      : ""
                  }
                  ${
                    project.agent.whatsapp
                      ? `
                    <div>
                      <div style="font-weight: bold; color: #1f2937;">WhatsApp:</div>
                      <div style="color: #6b7280;">${project.agent.whatsapp}</div>
                    </div>
                  `
                      : ""
                  }
                </div>
              </div>
            </div>
          `
              : ""
          }

          <!-- Project Information -->
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1f2937;">
              Información del Proyecto
            </h2>
            <div style="color: #6b7280; line-height: 1.8;">
              <div><strong>Nombre:</strong> ${project.name}</div>
              <div><strong>Tipo:</strong> ${getPropertyTypeLabel(project.propertyType)}</div>
              <div><strong>Estado:</strong> ${project.active ? "Activo" : "Inactivo"}</div>
              <div><strong>ID del Proyecto:</strong> ${project.id}</div>
              ${project.createdAt ? `<div><strong>Creado:</strong> ${new Date(project.createdAt).toLocaleDateString()}</div>` : ""}
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
            <div>Documento generado el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}</div>
            <div style="margin-top: 5px;">UbiGroup - Plataforma inmobiliaria</div>
          </div>
        </div>
      `;

      tempContainer.innerHTML = pdfContent;
      document.body.appendChild(tempContainer);

      // Ensure images inside the container are loaded before rendering
      const waitForImages = (container: HTMLElement, timeoutMs = 7000) =>
        new Promise<void>((resolve) => {
          const images = Array.from(container.querySelectorAll("img"));
          if (images.length === 0) {
            resolve();
            return;
          }
          let loadedCount = 0;
          const done = () => {
            loadedCount++;
            if (loadedCount >= images.length) resolve();
          };
          setTimeout(() => resolve(), timeoutMs);
          images.forEach((img) => {
            const image = img as HTMLImageElement;
            if (image.complete) {
              done();
            } else {
              image.addEventListener("load", done, { once: true });
              image.addEventListener("error", done, { once: true });
            }
          });
        });

      await waitForImages(tempContainer, 8000);

      // Generate PDF
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        imageTimeout: 10000,
        backgroundColor: "#ffffff",
        logging: false,
        width: 800,
        height: tempContainer.scrollHeight,
      });

      // Remove temporary container
      document.body.removeChild(tempContainer);

      // Create PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add multiple pages if content is too long
      let heightLeft = imgHeight;
      let position = 10; // 10mm top margin

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - 20;
      }

      // Download PDF
      const fileName = `${project.name.replace(/[^a-zA-Z0-9]/g, "_")}_${project.id}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error al generar el PDF. Intenta nuevamente.");
    }
  };

  return (
    <>
      <Button
        onClick={handleDownloadPdf}
        variant="outline"
        size="sm"
        className={variant === "sidebar" ? "w-full" : ""}
      >
        <Download className="h-4 w-4 mr-2" />
        {variant === "sidebar" ? "Descargar PDF" : "PDF"}
      </Button>
    </>
  );
}
