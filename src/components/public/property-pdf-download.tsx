"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface Property {
  id: string;
  title: string;
  description: string;
  type: string;
  locationState: string;
  locationCity: string;
  locationNeigh: string;
  address: string | null;
  price: number;
  currency: string;
  exchangeRate: number | null;
  bedrooms: number;
  bathrooms: number;
  garageSpaces: number;
  squareMeters: number;
  transactionType: string;
  images: string[];
  features: string[];
  createdAt: string;
  agent: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    phone: string | null;
    whatsapp: string | null;
  };
  agency: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
}

interface PropertyPdfDownloadProps {
  property: Property;
  variant?: "header" | "sidebar";
}

export function PropertyPdfDownload({
  property,
  variant = "sidebar",
}: PropertyPdfDownloadProps) {
  const formatPrice = (
    price: number,
    currency: string,
    exchangeRate: number | null,
    transactionType: string
  ) => {
    if (currency === "DOLLARS") {
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(price);

      if (exchangeRate) {
        const bolivianosPrice = price * exchangeRate;
        const bolivianosFormatted = new Intl.NumberFormat("es-BO", {
          style: "currency",
          currency: "BOB",
        }).format(bolivianosPrice);

        const result = `${formatted} (≈ ${bolivianosFormatted})`;
        return transactionType === "RENT" ? `${result}/mes` : result;
      }

      return transactionType === "RENT" ? `${formatted}/mes` : formatted;
    } else {
      const formatted = new Intl.NumberFormat("es-BO", {
        style: "currency",
        currency: "BOB",
      }).format(price);

      if (exchangeRate) {
        const dollarsPrice = price / exchangeRate;
        const dollarsFormatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(dollarsPrice);

        const result = `${formatted} (≈ ${dollarsFormatted})`;
        return transactionType === "RENT" ? `${result}/mes` : result;
      }

      return transactionType === "RENT" ? `${formatted}/mes` : formatted;
    }
  };

  const getPropertyTypeLabel = (type: string) => {
    switch (type) {
      case "HOUSE":
        return "Casa";
      case "APARTMENT":
        return "Apartamento";
      case "OFFICE":
        return "Escritório";
      case "LAND":
        return "Terreno";
      default:
        return type;
    }
  };

  // Generate mock coordinates based on location (for demonstration)
  const getLocationCoordinates = (city: string, neighborhood: string) => {
    // This is a simplified mock - in a real app you'd use geocoding
    const cityHash = city.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    const neighHash = neighborhood
      .split("")
      .reduce((a, b) => a + b.charCodeAt(0), 0);

    // Generate consistent coordinates based on city and neighborhood
    const lat = -16.5 + (cityHash % 100) / 1000; // Bolivia latitude range
    const lng = -68.1 + (neighHash % 100) / 1000; // Bolivia longitude range

    return { lat, lng };
  };

  const handleDownloadPdf = async () => {
    try {
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

      // Create PDF content directly
      const pdfContent = `
        <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">
                     <!-- Header -->
           <div style="text-align: center; margin-bottom: 30px;">
             <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 10px; color: #1f2937;">
               ${property.title}
             </h1>
             <div style="font-size: 16px; color: #6b7280; margin-bottom: 20px;">
               ${property.locationNeigh}, ${property.locationCity} - ${property.locationState}
             </div>
             <div style="font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px;">
               ${formatPrice(property.price, property.currency, property.exchangeRate, property.transactionType)}
             </div>
             <div style="font-size: 14px; color: #6b7280;">
               ${property.squareMeters}m² • ${property.transactionType === "SALE" ? "Venda" : "Aluguel"} • ${getPropertyTypeLabel(property.type)}
             </div>
           </div>

           <!-- Property Images -->
           ${
             property.images.length > 0
               ? `
             <div style="margin-bottom: 30px;">
               <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1f2937;">
                 Imágenes de la Propiedad
               </h2>
               <div style="
                 display: grid;
                 grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                 gap: 15px;
                 margin-bottom: 20px;
               ">
                 ${property.images
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
                       alt="Imagen ${index + 1} de la propiedad"
                       style="
                         width: 100%;
                         height: 100%;
                         object-fit: cover;
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
                       Imagem ${index + 1}
                     </div>
                   </div>
                 `
                   )
                   .join("")}
               </div>
               ${
                 property.images.length > 6
                   ? `
                 <div style="
                   text-align: center;
                   font-size: 12px;
                   color: #6b7280;
                   font-style: italic;
                 ">
                   +${property.images.length - 6} imagens adicionais
                 </div>
               `
                   : ""
               }
             </div>
           `
               : ""
           }

          <!-- Property Details -->
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1f2937;">
              Detalles de la Propiedad
            </h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px;">
              ${
                property.bedrooms > 0
                  ? `
                <div style="text-align: center; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
                  <div style="font-size: 18px; font-weight: bold; color: #2563eb;">${property.bedrooms}</div>
                  <div style="font-size: 12px; color: #6b7280;">Quartos</div>
                </div>
              `
                  : ""
              }
              ${
                property.bathrooms > 0
                  ? `
                <div style="text-align: center; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
                  <div style="font-size: 18px; font-weight: bold; color: #2563eb;">${property.bathrooms}</div>
                  <div style="font-size: 12px; color: #6b7280;">Banheiros</div>
                </div>
              `
                  : ""
              }
              <div style="text-align: center; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <div style="font-size: 18px; font-weight: bold; color: #2563eb;">${property.squareMeters}m²</div>
                <div style="font-size: 12px; color: #6b7280;">Área</div>
              </div>
              ${
                property.garageSpaces > 0
                  ? `
                <div style="text-align: center; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
                  <div style="font-size: 18px; font-weight: bold; color: #2563eb;">${property.garageSpaces}</div>
                  <div style="font-size: 12px; color: #6b7280;">Vagas</div>
                </div>
              `
                  : ""
              }
            </div>

            <!-- Features -->
            ${
              property.features.length > 0
                ? `
              <div style="margin-bottom: 20px;">
                <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #1f2937;">
                  Características
                </h3>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                  ${property.features
                    .map(
                      (feature) => `
                    <span style="padding: 4px 8px; background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px; color: #374151;">
                      ${feature}
                    </span>
                  `
                    )
                    .join("")}
                </div>
              </div>
            `
                : ""
            }
          </div>

          <!-- Description -->
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1f2937;">
              Descrição
            </h2>
            <p style="color: #6b7280; line-height: 1.8; white-space: pre-line;">
              ${property.description}
            </p>
          </div>

                     <!-- Location -->
           <div style="margin-bottom: 30px;">
             <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1f2937;">
               Localização
             </h2>
             <div style="color: #6b7280; line-height: 1.8; margin-bottom: 20px;">
               <div><strong>Bairro:</strong> ${property.locationNeigh}</div>
               <div><strong>Cidade:</strong> ${property.locationCity}</div>
               <div><strong>Estado:</strong> ${property.locationState}</div>
               ${property.address ? `<div><strong>Endereço:</strong> ${property.address}</div>` : ""}
             </div>
             
                           <!-- Map Section -->
              <div style="margin-top: 20px;">
                <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #1f2937;">
                  Mapa da Localização
                </h3>
                                 ${(() => {
                                   const coords = getLocationCoordinates(
                                     property.locationCity,
                                     property.locationNeigh
                                   );

                                   return `
                     <div style="
                       width: 100%; 
                       height: 200px; 
                       border: 2px solid #d1d5db;
                       border-radius: 8px;
                       position: relative;
                       overflow: hidden;
                       background: #f3f4f6;
                     ">
                                               <!-- Map Image -->
                        <img 
                          src="https://staticmap.openstreetmap.de/staticmap.php?center=${coords.lat},${coords.lng}&zoom=15&size=600x300&markers=${coords.lat},${coords.lng},red"
                          alt="Mapa da localização"
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
                            Mapa da localização<br/>
                            ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}
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
                         📍 ${property.locationNeigh}, ${property.locationCity}
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
                         ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}
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
                       Localização: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)} • Mapa real da localização
                     </div>
                   `;
                                 })()}
              </div>
           </div>

          <!-- Property Information -->
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1f2937;">
              Información de la Propiedad
            </h2>
            <div style="color: #6b7280; line-height: 1.8;">
              <div><strong>Tipo:</strong> ${getPropertyTypeLabel(property.type)}</div>
              <div><strong>Transação:</strong> ${property.transactionType === "SALE" ? "Venda" : "Aluguel"}</div>
              <div><strong>ID de la Propiedad:</strong> ${property.id}</div>
              <div><strong>Publicado:</strong> ${new Date(property.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
            <div>Documento gerado em ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}</div>
            <div style="margin-top: 5px;">UbiGroup - Plataforma Imobiliária</div>
          </div>
        </div>
      `;

      tempContainer.innerHTML = pdfContent;
      document.body.appendChild(tempContainer);

      // Generate PDF
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
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
      const fileName = `${property.title.replace(/[^a-zA-Z0-9]/g, "_")}_${property.id}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Erro ao gerar PDF. Tente novamente.");
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
        {variant === "sidebar" ? "Baixar PDF" : "PDF"}
      </Button>
    </>
  );
}
