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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PropertyMap } from "@/components/public/property-map";
import { ProjectPdfDownload } from "@/components/public/project-pdf-download";
import Image from "next/image";
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

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapSnapshot, setMapSnapshot] = useState<string | null>(null);

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
    if (project?.agent?.whatsapp) {
      const message = encodeURIComponent(
        `¡Hola! Tengo interés en el proyecto "${project.name}" (ID: ${project.id}). ¿Podrías darme más información?`
      );
      const whatsappUrl = `https://wa.me/${project.agent.whatsapp.replace(/\D/g, "")}?text=${message}`;
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
                  <Badge variant="outline">
                    {getPropertyTypeLabel(project.propertyType)}
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
        {/* Project Description */}
        <div className="mb-8">
          <p className="text-lg text-muted-foreground">{project.description}</p>
        </div>

        {/* Agent Contact */}
        {project.agent && (
          <div className="mb-8">
            <Card className="w-full lg:w-80 ml-auto">
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
                  {project.agent.whatsapp && (
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
          </div>
        )}

        {/* Project Images */}
        {project.images && project.images.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.images.map((image, index) => (
                <div
                  key={index}
                  className="relative h-64 rounded-lg overflow-hidden border border-border"
                >
                  <Image
                    src={image}
                    alt={`${project.name} - Imagen ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Layers className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">
                    {project.floors?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Pisos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Home className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{totalUnits}</p>
                  <p className="text-sm text-muted-foreground">
                    Unidades Totales
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{availableUnits}</p>
                  <p className="text-sm text-muted-foreground">Disponibles</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Map */}
        {project.latitude && project.longitude && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Ubicación
            </h2>
            <div
              className="h-96 rounded-lg overflow-hidden border border-border"
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
          </div>
        )}

        {/* Floors and Units */}
        {project.floors && project.floors.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Pisos y Unidades
            </h2>
            <div className="space-y-6">
              {project.floors.map((floor) => (
                <Card key={floor.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>
                        Piso {floor.number}
                        {floor.name && ` - ${floor.name}`}
                      </span>
                      <Badge variant="outline">
                        {floor.quadrants?.length || 0} unidades
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {floor.quadrants && floor.quadrants.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                              {quadrant.bedrooms !== undefined && (
                                <div className="flex items-center gap-1">
                                  <Bed className="h-3 w-3" />
                                  <span>{quadrant.bedrooms}</span>
                                </div>
                              )}
                              {quadrant.bathrooms !== undefined && (
                                <div className="flex items-center gap-1">
                                  <Bath className="h-3 w-3" />
                                  <span>{quadrant.bathrooms}</span>
                                </div>
                              )}
                              {quadrant.area !== undefined && (
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">
                                    {quadrant.area} m²
                                  </span>
                                </div>
                              )}
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
          </div>
        )}

        {/* Project Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Información del Proyecto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Descripción</h4>
                <p className="text-muted-foreground">{project.description}</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Ubicación</h4>
                <p className="text-muted-foreground">{project.location}</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Tipo de Propiedad</h4>
                <p className="text-muted-foreground">
                  {getPropertyTypeLabel(project.propertyType)}
                </p>
              </div>
              {project.createdAt && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">Fecha de Creación</h4>
                    <p className="text-muted-foreground">
                      {new Date(project.createdAt).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {project.floors?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total de Pisos
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {totalUnits}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Unidades Totales
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {availableUnits}
                  </p>
                  <p className="text-sm text-muted-foreground">Disponibles</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {totalUnits - availableUnits}
                  </p>
                  <p className="text-sm text-muted-foreground">Ocupadas</p>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Estado del Proyecto</h4>
                <Badge variant={project.active ? "default" : "secondary"}>
                  {project.active ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
