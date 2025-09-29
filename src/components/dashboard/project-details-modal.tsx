"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Building2, Calendar, User, Building } from "lucide-react";
import { PropertyStatus } from "@prisma/client";

type ProjectData = {
  id: string;
  name: string;
  description: string;
  location: string;
  status: PropertyStatus;
  createdAt: string;
  updatedAt: string;
  agent: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  agency: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  floors: Array<{
    id: string;
    name: string;
    quadrants: Array<{
      id: string;
      name: string;
      type?: string;
      status?: string;
    }>;
  }>;
};

interface ProjectDetailsModalProps {
  projectId: string | null;
  isOpen: boolean;
  onClose: () => void;
  project?: ProjectData | null;
}

// Helper function to get status badge variant
const getStatusBadgeVariant = (status: PropertyStatus) => {
  switch (status) {
    case "PENDING":
      return "secondary";
    case "APPROVED":
      return "default";
    case "REJECTED":
      return "destructive";
    default:
      return "outline";
  }
};

// Helper function to get status label
const getStatusLabel = (status: PropertyStatus) => {
  switch (status) {
    case "PENDING":
      return "Pendiente";
    case "APPROVED":
      return "Aprobado";
    case "REJECTED":
      return "Rechazado";
    default:
      return status;
  }
};

// Helper function to get total quadrants
const getTotalQuadrants = (floors: ProjectData["floors"]) => {
  return (
    floors?.reduce(
      (total: number, floor) => total + floor.quadrants.length,
      0
    ) || 0
  );
};

export function ProjectDetailsModal({
  projectId,
  isOpen,
  onClose,
  project,
}: ProjectDetailsModalProps) {
  if (!project) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-2xl font-bold">
            {project.name}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Detalles completos del proyecto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Status Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <Badge
              variant={getStatusBadgeVariant(project.status)}
              className="text-xs sm:text-sm w-fit"
            >
              {getStatusLabel(project.status)}
            </Badge>
            <div className="text-xs sm:text-sm text-muted-foreground">
              ID: {project.id}
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <div>
              <h3 className="font-semibold mb-2 text-sm sm:text-base">
                Descripción
              </h3>
              <p className="text-muted-foreground text-sm">
                {project.description}
              </p>
            </div>
          )}

          {/* Location */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center text-sm sm:text-base">
              <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
              Ubicación
            </h3>
            <p className="text-muted-foreground text-sm">{project.location}</p>
          </div>

          {/* Project Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium">
                    Total de Unidades
                  </p>
                  <p className="text-lg sm:text-2xl font-bold">
                    {getTotalQuadrants(project.floors)}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium">Pisos</p>
                  <p className="text-lg sm:text-2xl font-bold">
                    {project.floors?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Agent Information */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center text-sm sm:text-base">
              <User className="h-4 w-4 mr-2 flex-shrink-0" />
              Agente Responsable
            </h3>
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                <AvatarImage src={project.agent.avatarUrl || ""} />
                <AvatarFallback className="text-xs">
                  {project.agent.firstName?.[0] || ""}
                  {project.agent.lastName?.[0] || ""}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm sm:text-base truncate">
                  {project.agent.firstName} {project.agent.lastName}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {project.agency.name}
                </p>
              </div>
            </div>
          </div>

          {/* Floors and Units */}
          {project.floors && project.floors.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-sm sm:text-base">
                Estructura del Proyecto
              </h3>
              <div className="space-y-3">
                {project.floors.map((floor) => (
                  <div key={floor.id} className="p-3 border rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                      <h4 className="font-medium text-sm sm:text-base">
                        {floor.name}
                      </h4>
                      <Badge variant="outline" className="text-xs w-fit">
                        {floor.quadrants.length} unidades
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {floor.quadrants.map((quadrant) => (
                        <div
                          key={quadrant.id}
                          className="text-xs sm:text-sm p-2 bg-muted rounded text-center"
                        >
                          {quadrant.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center text-sm sm:text-base">
                <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                Fecha de Creación
              </h3>
              <p className="text-muted-foreground text-sm">
                {new Date(project.createdAt).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center text-sm sm:text-base">
                <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                Última Actualización
              </h3>
              <p className="text-muted-foreground text-sm">
                {new Date(project.updatedAt).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
