"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import {
  MapPin,
  Building2,
  Users,
  ArrowLeft,
  Layers,
  Home,
  Bath,
  Bed,
  AlertCircle,
  Phone,
  MessageCircle,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PropertyMap } from "@/components/public/property-map";
import { ProjectPdfDownload } from "@/components/public/project-pdf-download";
import Image from "next/image";
import html2canvas from "html2canvas";

interface Project {
  id: string;
  name: string;
  description: string;
  location: string;

  images: string[];
  brochureUrl?: string | null;
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
  };
  agency?: {
    name: string;
    logoUrl?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapSnapshot, setMapSnapshot] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageGallery, setShowImageGallery] = useState(false);

  const projectId = params.id as string;

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/public/projects/${projectId}`);

        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Project data received:", data.project);
        console.log("Brochure URL:", data.project?.brochureUrl);
        setProject(data.project);
      } catch (error) {
        console.error("Error fetching project:", error);
        setError("Error al cargar el proyecto. Por favor, intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const formatPrice = (price: number, currency: string = "USD") => {
    const currencySymbol = currency === "DOLLARS" ? "$" : "Bs.";
    return `${currencySymbol} ${price.toLocaleString()}`;
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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "default";
      case "UNAVAILABLE":
        return "destructive";
      case "RESERVED":
        return "secondary";
      default:
        return "outline";
    }
  };

  const handleContactWhatsApp = () => {
    if (project?.agent?.phone) {
      const projectUrl = `https://ubigroup.vercel.app/project/${project.id}`;
      const location = project.location || "Ubicación no especificada";

      const message = `Hola, me interesa obtener más información sobre este proyecto:

🏗️ ${project.name}
📍 ${location}
🔗 ${projectUrl}

¿Podrías proporcionarme más detalles sobre las unidades disponibles y precios?`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${project.agent.phone.replace(/\D/g, "")}?text=${encodedMessage}`;
      window.open(whatsappUrl, "_blank");
    }
  };

  const handleContactPhone = () => {
    if (project?.agent?.phone) {
      window.location.href = `tel:${project.agent.phone}`;
    }
  };

  const handleFavorite = () => {
    // TODO: Implement favorite functionality
    console.log("Add to favorites:", project?.id);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: project?.name || "Proyecto en UbiGroup",
        text: `Mira este proyecto: ${project?.name}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could add a toast notification here
      console.log("URL copied to clipboard");
    }
  };

  const captureMapSnapshot = async (): Promise<string | null> => {
    try {
      const mapElement = document.querySelector(
        "[data-map-container]"
      ) as HTMLElement;
      if (mapElement) {
        const canvas = await html2canvas(mapElement, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
        });
        const dataUrl = canvas.toDataURL("image/png");
        setMapSnapshot(dataUrl);
        return dataUrl;
      }
    } catch (error) {
      console.error("Error capturing map snapshot:", error);
    }
    return null;
  };

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setShowImageGallery(true);
  };

  const nextImage = () => {
    if (project?.images) {
      setCurrentImageIndex((prev) =>
        prev === project.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (project?.images) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? project.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando proyecto...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background dark">
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!project) {
    return notFound();
  }

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

  return (
    <div className="min-h-screen bg-background dark">
      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="text-foreground border-border hover:bg-accent hover:text-accent-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFavorite}
                className="text-foreground border-border hover:bg-accent hover:text-accent-foreground"
              >
                <Heart className="h-4 w-4 mr-2" />
                Favorito
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="text-foreground border-border hover:bg-accent hover:text-accent-foreground"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Compartir
              </Button>
              {project?.brochureUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log("Opening brochure:", project.brochureUrl);
                    window.open(project.brochureUrl!, "_blank");
                  }}
                  className="text-foreground border-border hover:bg-accent hover:text-accent-foreground"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Brochure
                </Button>
              )}
              {project && (
                <ProjectPdfDownload
                  project={project}
                  variant="header"
                  mapSnapshotDataUrl={mapSnapshot}
                  onBeforeGenerate={captureMapSnapshot}
                />
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">
                {project.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{project.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={project.active ? "default" : "secondary"}>
                    {project.active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="md:text-right">
              <div className="text-2xl md:text-3xl font-bold text-primary mb-0.5 md:mb-1">
                {totalUnits} Unidades
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                {availableUnits} disponibles • {project.floors?.length || 0}{" "}
                pisos
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Images and Contact Section */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Project Images */}
            {project.images && project.images.length > 0 && (
              <div className="lg:col-span-3">
                {project.images.length === 1 ? (
                  /* Single Image Layout: Full width */
                  <div className="h-full">
                    <div
                      className="relative w-full h-full rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handleImageClick(0)}
                    >
                      <Image
                        src={project.images[0]}
                        alt={`${project.name} - Imagen principal`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  /* Multiple Images Layout: Main image + thumbnails */
                  <div className="grid grid-cols-3 gap-4 h-full">
                    {/* Main Image - spans 2 columns */}
                    <div className="col-span-2 h-full">
                      <div
                        className="relative w-full h-full rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => handleImageClick(0)}
                      >
                        <Image
                          src={project.images[0]}
                          alt={`${project.name} - Imagen principal`}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
                          1 / {project.images.length}
                        </div>
                      </div>
                    </div>

                    {/* Thumbnails Column */}
                    <div className="grid grid-rows-3 gap-4 h-full">
                      {/* Thumbnail 2 */}
                      {project.images.length > 1 && (
                        <div className="h-full">
                          <div
                            className="relative w-full h-full rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => handleImageClick(1)}
                          >
                            <Image
                              src={project.images[1]}
                              alt={`${project.name} - Imagen 2`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>
                      )}

                      {/* Thumbnail 3 */}
                      {project.images.length > 2 && (
                        <div className="h-full">
                          <div
                            className="relative w-full h-full rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => handleImageClick(2)}
                          >
                            <Image
                              src={project.images[2]}
                              alt={`${project.name} - Imagen 3`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>
                      )}

                      {/* Thumbnail 4 or Overflow */}
                      {project.images.length > 3 && (
                        <div className="h-full">
                          <div
                            className="relative w-full h-full rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => handleImageClick(3)}
                          >
                            <Image
                              src={project.images[3]}
                              alt={`${project.name} - ${project.images.length === 4 ? "Imagen 4" : "Más imágenes"}`}
                              fill
                              className="object-cover"
                            />
                            {project.images.length > 4 && (
                              <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white font-medium">
                                +{project.images.length - 4}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Contact and Info Sidebar */}
            <div className="lg:col-span-1 space-y-6" id="sidebar-cards">
              {/* Agent Contact */}
              {project.agent && (
                <Card>
                  <CardHeader>
                    <CardTitle>Contacta al agente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Agent Info */}
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">
                          {project.agent.firstName} {project.agent.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Building2 className="h-3 w-3 mr-1" />
                          {project.agency?.name}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Contact Buttons */}
                    <div className="space-y-3">
                      {project.agent.phone && (
                        <Button
                          onClick={handleContactWhatsApp}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          WhatsApp
                        </Button>
                      )}

                      {project.agent.phone && (
                        <Button
                          onClick={handleContactPhone}
                          variant="outline"
                          className="w-full"
                        >
                          <Phone className="mr-2 h-4 w-4" />
                          Llamar
                        </Button>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground text-center pt-2">
                      Al contactar, menciona que viste este proyecto en UbiGroup
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Información rápida</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pisos:</span>
                    <span className="font-medium">
                      {project.floors?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unidades:</span>
                    <span className="font-medium">{totalUnits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Disponibles:</span>
                    <span className="font-medium text-green-600">
                      {availableUnits}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado:</span>
                    <Badge variant={project.active ? "default" : "secondary"}>
                      {project.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  {project.createdAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Publicado:</span>
                      <span className="font-medium">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {/* Brochure and PDF Download Buttons */}
                  <div className="pt-3 border-t space-y-2">
                    {project.brochureUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          console.log(
                            "Opening brochure from sidebar:",
                            project.brochureUrl
                          );
                          window.open(project.brochureUrl!, "_blank");
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Descargar Brochure
                      </Button>
                    )}
                    <ProjectPdfDownload
                      project={project}
                      variant="sidebar"
                      mapSnapshotDataUrl={mapSnapshot}
                      onBeforeGenerate={captureMapSnapshot}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-8">
          {/* Project Information */}
          <div className="space-y-6">
            {/* Project Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas del Proyecto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-2 mx-auto">
                      <Layers className="h-6 w-6 text-primary" />
                    </div>
                    <div className="font-semibold">
                      {project.floors?.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Pisos</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-2 mx-auto">
                      <Home className="h-6 w-6 text-primary" />
                    </div>
                    <div className="font-semibold">{totalUnits}</div>
                    <div className="text-sm text-muted-foreground">
                      Unidades Totales
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-2 mx-auto">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="font-semibold">{availableUnits}</div>
                    <div className="text-sm text-muted-foreground">
                      Disponibles
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Descripción del Proyecto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm md:text-base">
                  {project.description}
                </p>
              </CardContent>
            </Card>

            {/* Location */}
            {project.latitude && project.longitude && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Ubicación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div>
                      <strong>Ubicación:</strong> {project.location}
                    </div>
                  </div>

                  {/* Map */}
                  <div
                    className="h-64 rounded-lg overflow-hidden border border-border"
                    data-map-container
                  >
                    <PropertyMap
                      properties={[]}
                      projects={[
                        {
                          id: project.id,
                          name: project.name,
                          location: project.location,
                          latitude: project.latitude as number,
                          longitude: project.longitude as number,
                        },
                      ]}
                      className="w-full h-full"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Floors and Units */}
            {project.floors && project.floors.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-foreground">
                  Pisos y Unidades
                </h3>
                {project.floors
                  .sort((a, b) => a.number - b.number)
                  .map((floor) => (
                    <Card key={floor.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{floor.name || `Piso ${floor.number}`}</span>
                          <Badge variant="outline">
                            {floor.quadrants?.length || 0} unidades
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {floor.quadrants && floor.quadrants.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {floor.quadrants.map((quadrant) => (
                              <Card key={quadrant.id} className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold">
                                    Unidad {quadrant.customId}
                                  </h4>
                                  <Badge
                                    variant={getStatusVariant(quadrant.status)}
                                  >
                                    {getStatusLabel(quadrant.status)}
                                  </Badge>
                                </div>
                                {quadrant.price && (
                                  <p className="text-lg font-bold text-primary mb-2">
                                    {formatPrice(
                                      quadrant.price,
                                      quadrant.currency || "USD"
                                    )}
                                  </p>
                                )}
                                <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Bed className="h-3 w-3" />
                                    <span>{quadrant.bedrooms || 0}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Bath className="h-3 w-3" />
                                    <span>{quadrant.bathrooms || 0}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">
                                      {quadrant.area || 0} m²
                                    </span>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">
                            No hay unidades disponibles en este piso.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {project.images && project.images.length > 0 && (
        <Dialog open={showImageGallery} onOpenChange={setShowImageGallery}>
          <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>{project.name}</DialogTitle>
            </DialogHeader>
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <Image
                src={project.images[currentImageIndex]}
                alt={`${project.name} - Imagen ${currentImageIndex + 1}`}
                fill
                className="object-contain"
              />

              {/* Navigation */}
              {project.images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 rounded-full"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 rounded-full"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {project.images.length}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
