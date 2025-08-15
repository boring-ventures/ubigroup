"use client";

import React, { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MapPin,
  Users,
  Plus,
  Layers,
  Grid3X3,
  CheckCircle,
  XCircle,
  Clock,
  Trash,
} from "lucide-react";
import Image from "next/image";
import {
  createFloorSchema,
  createQuadrantSchema,
} from "@/lib/validations/project";
import { PropertyType, Currency, QuadrantStatus } from "@prisma/client";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Client-side only date formatter to prevent hydration errors
function ClientDateFormatter({ date }: { date: string }) {
  const [formattedDate, setFormattedDate] = useState<string>("");

  React.useEffect(() => {
    setFormattedDate(new Date(date).toLocaleDateString());
  }, [date]);

  return <span>{formattedDate}</span>;
}

// Client-side only wrapper to prevent hydration errors
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}

interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  propertyType: PropertyType;
  images: string[];
  createdAt: string;
  active: boolean;
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
  floors: {
    id: string;
    number: number;
    name: string | null;
    quadrants: {
      id: string;
      customId: string;
      area: number;
      bedrooms: number;
      bathrooms: number;
      price: number;
      currency: Currency;
      status: QuadrantStatus;
      active: boolean;
    }[];
  }[];
}

interface ProjectDetailProps {
  project: Project;
}

export function ProjectDetail({ project }: ProjectDetailProps) {
  const [selectedFloor, setSelectedFloor] = useState<
    Project["floors"][0] | null
  >(null);
  const [showFloorDialog, setShowFloorDialog] = useState(false);
  const [showQuadrantDialog, setShowQuadrantDialog] = useState(false);
  type Quadrant = Project["floors"][0]["quadrants"][0];
  const [selectedQuadrant, setSelectedQuadrant] = useState<Quadrant | null>(
    null
  );
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Local staged state
  const [localFloors, setLocalFloors] = useState<Project["floors"]>(
    project.floors
  );
  const [deletedFloorIds, setDeletedFloorIds] = useState<string[]>([]);
  const [deletedQuadrantIds, setDeletedQuadrantIds] = useState<string[]>([]);
  const originalFloors = useMemo(() => project.floors, [project.floors]);

  type CreateFloorInput = z.infer<typeof createFloorSchema>;
  type CreateQuadrantInput = z.infer<typeof createQuadrantSchema>;

  const floorForm = useForm({
    resolver: zodResolver(createFloorSchema),
    defaultValues: {
      number: 1,
      name: undefined,
    },
  });

  const quadrantForm = useForm({
    resolver: zodResolver(createQuadrantSchema),
    defaultValues: {
      area: 0,
      bedrooms: 0,
      bathrooms: 0,
      price: 0,
      currency: Currency.BOLIVIANOS,
      status: QuadrantStatus.AVAILABLE,
      active: true,
    },
  });

  // Staging helpers
  const generateTempId = () => `temp_${Math.random().toString(36).slice(2)}`;

  const handleFloorSubmit = (data: CreateFloorInput) => {
    if (selectedFloor) {
      // Editing a single floor: ensure no duplicate number
      const exists = localFloors.some(
        (f) => f.number === data.number && f.id !== selectedFloor.id
      );
      if (exists) {
        toast({
          title: "Error",
          description: `Ya existe un piso con el número ${data.number}`,
          variant: "destructive",
        });
        return;
      }
      setLocalFloors((prev) =>
        prev.map((f) =>
          f.id === selectedFloor.id
            ? { ...f, number: data.number, name: null }
            : f
        )
      );
      toast({ title: "Éxito", description: "Piso actualizado localmente" });
    } else {
      // Creating multiple floors: 'number' is the count to add
      const countToAdd = Math.max(1, Math.floor(data.number));
      const maxNumber = localFloors.reduce(
        (max, f) => Math.max(max, f.number),
        0
      );
      const newFloors: Project["floors"] = [];
      for (let i = 1; i <= countToAdd; i++) {
        newFloors.push({
          id: generateTempId(),
          number: maxNumber + i,
          name: null,
          quadrants: [],
        } as Project["floors"][number]);
      }
      setLocalFloors((prev) => [...prev, ...newFloors]);
      toast({
        title: "Éxito",
        description: `${countToAdd} piso(s) agregado(s) localmente`,
      });
    }
    setShowFloorDialog(false);
    setSelectedFloor(null);
    floorForm.reset();
  };

  const handleDeleteFloor = (floorId: string) => {
    setLocalFloors((prev) => prev.filter((f) => f.id !== floorId));
    if (!floorId.startsWith("temp_")) {
      setDeletedFloorIds((prev) => [...prev, floorId]);
    }
    toast({ title: "Éxito", description: "Piso eliminado localmente" });
  };

  const handleQuadrantSubmit = (data: CreateQuadrantInput) => {
    if (!selectedFloor) return;
    setLocalFloors((prev) =>
      prev.map((f) => {
        if (f.id !== selectedFloor.id) return f;
        if (selectedQuadrant) {
          return {
            ...f,
            quadrants: f.quadrants.map((q) =>
              q.id === selectedQuadrant.id
                ? {
                    ...q,
                    area: data.area,
                    bedrooms: data.bedrooms,
                    bathrooms: data.bathrooms,
                    price: data.price,
                    currency: data.currency,
                    status: data.status ?? q.status,
                    active: data.active ?? q.active,
                  }
                : q
            ),
          };
        }
        return {
          ...f,
          quadrants: [
            ...f.quadrants,
            {
              id: generateTempId(),
              customId: "TEMP",
              area: data.area,
              bedrooms: data.bedrooms,
              bathrooms: data.bathrooms,
              price: data.price,
              currency: data.currency,
              status: data.status ?? QuadrantStatus.AVAILABLE,
              active: data.active ?? true,
            } as Project["floors"][number]["quadrants"][number],
          ],
        };
      })
    );
    setShowQuadrantDialog(false);
    setSelectedQuadrant(null);
    quadrantForm.reset();
    toast({
      title: "Éxito",
      description: selectedQuadrant
        ? "Cuadrante actualizado localmente"
        : "Cuadrante agregado localmente",
    });
  };

  const handleDeleteQuadrant = (floorId: string, quadrantId: string) => {
    setLocalFloors((prev) =>
      prev.map((f) =>
        f.id === floorId
          ? {
              ...f,
              quadrants: f.quadrants.filter((q) => q.id !== quadrantId),
            }
          : f
      )
    );
    if (!quadrantId.startsWith("temp_")) {
      setDeletedQuadrantIds((prev) => [...prev, quadrantId]);
    }
    toast({ title: "Éxito", description: "Cuadrante eliminado localmente" });
  };

  const persistChanges = async () => {
    try {
      setIsSaving(true);
      // Validate duplicates client-side before contacting server
      const numbers = new Map<number, number>();
      for (const f of localFloors) {
        numbers.set(f.number, (numbers.get(f.number) ?? 0) + 1);
      }
      const duplicateEntry = Array.from(numbers.entries()).find(
        ([, c]) => c > 1
      );
      if (duplicateEntry) {
        throw new Error(
          `Número de piso duplicado: ${duplicateEntry[0]}. Cada piso debe tener un número único.`
        );
      }
      const originalFloorsMap = new Map(originalFloors.map((f) => [f.id, f]));

      // 0) Process deletions first
      for (const qId of deletedQuadrantIds) {
        // Need the owning floor id; attempt to find it in original or local
        const floorContaining = [...originalFloors, ...localFloors].find((f) =>
          f.quadrants.some((q) => q.id === qId)
        );
        if (!floorContaining) continue;
        const res = await fetch(`/api/floors/${floorContaining.id}/quadrants`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quadrantId: qId }),
        });
        if (!res.ok) {
          let reason = "No se pudo eliminar un cuadrante";
          try {
            const data = await res.json();
            if (data?.error) reason = data.error;
          } catch {}
          throw new Error(reason);
        }
      }

      for (const fId of deletedFloorIds) {
        const res = await fetch(`/api/floors/${fId}`, { method: "DELETE" });
        if (!res.ok) {
          let reason = "No se pudo eliminar un piso";
          try {
            const data = await res.json();
            if (data?.error) reason = data.error;
          } catch {}
          throw new Error(reason);
        }
      }

      // 1) Create new floors
      const floorIdMap = new Map<string, string>();
      for (const f of localFloors) {
        if (f.id.startsWith("temp_")) {
          const res = await fetch(`/api/projects/${project.id}/floors`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              number: f.number,
              name: f.name ?? undefined,
            }),
          });
          if (!res.ok) {
            let reason = "No se pudo crear un piso";
            try {
              const data = await res.json();
              if (data?.error) reason = data.error;
            } catch {}
            throw new Error(reason);
          }
          const created = await res.json();
          floorIdMap.set(f.id, created.id);
        }
      }

      // 2) Update existing floors
      for (const f of localFloors) {
        if (f.id.startsWith("temp_")) continue;
        const orig = originalFloorsMap.get(f.id);
        if (!orig) continue;
        if (
          orig.number !== f.number ||
          (orig.name ?? null) !== (f.name ?? null)
        ) {
          const res = await fetch(`/api/floors/${f.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              number: f.number,
              name: f.name ?? undefined,
            }),
          });
          if (!res.ok) {
            let reason = "No se pudo actualizar un piso";
            try {
              const data = await res.json();
              if (data?.error) reason = data.error;
            } catch {}
            throw new Error(reason);
          }
        }
      }

      // 3) Create/Update quadrants (skip deleted)
      for (const f of localFloors) {
        const persistedFloorId = f.id.startsWith("temp_")
          ? floorIdMap.get(f.id)!
          : f.id;
        const orig = originalFloorsMap.get(f.id);
        const origQMap = new Map((orig?.quadrants ?? []).map((q) => [q.id, q]));

        for (const q of f.quadrants) {
          if (deletedQuadrantIds.includes(q.id)) continue;
          const isNewQ = q.id.startsWith("temp_");
          if (isNewQ) {
            const res = await fetch(
              `/api/floors/${persistedFloorId}/quadrants`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  area: q.area,
                  bedrooms: q.bedrooms,
                  bathrooms: q.bathrooms,
                  price: q.price,
                  currency: q.currency,
                  status: q.status,
                  active: q.active,
                }),
              }
            );
            if (!res.ok) {
              let reason = "No se pudo crear un cuadrante";
              try {
                const data = await res.json();
                if (data?.error) reason = data.error;
              } catch {}
              throw new Error(reason);
            }
          } else {
            const oq = origQMap.get(q.id);
            if (!oq) continue;
            const changed =
              oq.area !== q.area ||
              oq.bedrooms !== q.bedrooms ||
              oq.bathrooms !== q.bathrooms ||
              oq.price !== q.price ||
              oq.currency !== q.currency ||
              oq.status !== q.status ||
              oq.active !== q.active;
            if (changed) {
              const res = await fetch(
                `/api/floors/${persistedFloorId}/quadrants`,
                {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    quadrantId: q.id,
                    area: q.area,
                    bedrooms: q.bedrooms,
                    bathrooms: q.bathrooms,
                    price: q.price,
                    currency: q.currency,
                    status: q.status,
                    active: q.active,
                  }),
                }
              );
              if (!res.ok) {
                let reason = "No se pudo actualizar un cuadrante";
                try {
                  const data = await res.json();
                  if (data?.error) reason = data.error;
                } catch {}
                throw new Error(reason);
              }
            }
          }
        }
      }

      toast({ title: "Éxito", description: "Cambios guardados correctamente" });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.refresh();
    } catch (e) {
      toast({
        title: "Error",
        description:
          (e as Error).message ?? "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuadrantClick = (quadrant: Quadrant) => {
    setSelectedQuadrant(quadrant);
    quadrantForm.reset({
      area: quadrant.area,
      bedrooms: quadrant.bedrooms,
      bathrooms: quadrant.bathrooms,
      price: quadrant.price,
      currency: quadrant.currency,
      status: quadrant.status,
      active: quadrant.active,
    });
    setShowQuadrantDialog(true);
  };

  const getStatusColor = (status: QuadrantStatus) => {
    switch (status) {
      case QuadrantStatus.AVAILABLE:
        return "bg-green-500";
      case QuadrantStatus.UNAVAILABLE:
        return "bg-red-500";
      case QuadrantStatus.RESERVED:
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: QuadrantStatus) => {
    switch (status) {
      case QuadrantStatus.AVAILABLE:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case QuadrantStatus.UNAVAILABLE:
        return <XCircle className="h-4 w-4 text-red-600" />;
      case QuadrantStatus.RESERVED:
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground flex items-center mt-2">
            <MapPin className="mr-1 h-4 w-4" />
            {project.location}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={project.active ? "default" : "secondary"}>
            {project.active ? "Activo" : "Inactivo"}
          </Badge>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/projects/${project.id}/edit`}>Editar proyecto</Link>
          </Button>
        </div>
      </div>

      {/* Project Images */}
      {project.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Imágenes del proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {project.images.map((image, index) => (
                <Image
                  key={index}
                  src={image}
                  alt={`Project image ${index + 1}`}
                  width={200}
                  height={150}
                  className="rounded-lg object-cover w-full h-32"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información del proyecto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Descripción</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {project.description}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tipo de propiedad:</span>
              <Badge variant="outline">{project.propertyType}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total de pisos:</span>
              <span className="font-medium">{localFloors.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total de cuadrantes:</span>
              <span className="font-medium">
                {localFloors.reduce(
                  (total, floor) => total + floor.quadrants.length,
                  0
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Creado:</span>
              <span className="text-sm text-muted-foreground">
                <ClientDateFormatter date={project.createdAt} />
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información del agente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              {project.agent.avatarUrl ? (
                <Image
                  src={project.agent.avatarUrl}
                  alt="Avatar del agente"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
              )}
              <div>
                <p className="font-medium">
                  {project.agent.firstName} {project.agent.lastName}
                </p>
                <p className="text-sm text-muted-foreground">Agente</p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Agencia</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {project.agency.name}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floors and Quadrants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Layers className="mr-2 h-5 w-5" />
              Pisos y cuadrantes
            </CardTitle>
            <ClientOnly>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setSelectedFloor(null);
                    floorForm.reset({ number: 1 });
                    setShowFloorDialog(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Pisos
                </Button>
                <Button size="sm" onClick={persistChanges} disabled={isSaving}>
                  {isSaving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </ClientOnly>
          </div>
        </CardHeader>
        <CardContent>
          {localFloors.length === 0 ? (
            <div className="text-center py-8">
              <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aún no hay pisos</h3>
              <p className="text-muted-foreground mb-4">
                Agrega tu primer piso para empezar a crear cuadrantes
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {localFloors.map((floor) => (
                <div key={floor.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Piso {floor.number}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {floor.quadrants.length} cuadrantes
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {null}
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500 text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteFloor(floor.id)}
                        aria-label="Eliminar piso"
                        title="Eliminar piso"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedFloor(floor);
                          setSelectedQuadrant(null);
                          quadrantForm.reset();
                          setShowQuadrantDialog(true);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar cuadrante
                      </Button>
                    </div>
                  </div>

                  {floor.quadrants.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-muted-foreground rounded-lg">
                      <Grid3X3 className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Aún no hay cuadrantes
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {floor.quadrants.map((quadrant) => (
                        <div
                          key={quadrant.id}
                          className={`relative p-3 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(
                            quadrant.status
                          )} bg-opacity-10`}
                          onClick={() => {
                            setSelectedFloor(floor);
                            handleQuadrantClick(quadrant);
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium">
                              {quadrant.customId}
                            </span>
                            {getStatusIcon(quadrant.status)}
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>Área:</span>
                              <span>{quadrant.area}m²</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Dorm:</span>
                              <span>{quadrant.bedrooms}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Baño:</span>
                              <span>{quadrant.bathrooms}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Precio:</span>
                              <span>${quadrant.price.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="mt-2 flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500 text-red-600 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteQuadrant(floor.id, quadrant.id);
                              }}
                              aria-label="Eliminar cuadrante"
                              title="Eliminar cuadrante"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quadrant Dialog */}
      <ClientOnly>
        <Dialog open={showQuadrantDialog} onOpenChange={setShowQuadrantDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedQuadrant
                  ? "Editar cuadrante"
                  : "Agregar nuevo cuadrante"}
              </DialogTitle>
              <DialogDescription>
                {selectedQuadrant
                  ? "Actualizar información del cuadrante"
                  : "Agregar un nuevo cuadrante a este piso"}
              </DialogDescription>
            </DialogHeader>
            <Form {...quadrantForm}>
              <form
                onSubmit={quadrantForm.handleSubmit(handleQuadrantSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={quadrantForm.control}
                    name="area"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Área (m²)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={quadrantForm.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dormitorios</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={quadrantForm.control}
                    name="bathrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Baños</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={quadrantForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={quadrantForm.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Moneda</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={Currency.BOLIVIANOS}>
                              Bolivianos
                            </SelectItem>
                            <SelectItem value={Currency.DOLLARS}>
                              Dólares
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={quadrantForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={QuadrantStatus.AVAILABLE}>
                              Disponible
                            </SelectItem>
                            <SelectItem value={QuadrantStatus.UNAVAILABLE}>
                              No disponible
                            </SelectItem>
                            <SelectItem value={QuadrantStatus.RESERVED}>
                              Reservado
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowQuadrantDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {selectedQuadrant
                      ? "Actualizar cuadrante"
                      : "Crear cuadrante"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </ClientOnly>

      {/* Floor Dialog */}
      <ClientOnly>
        <Dialog open={showFloorDialog} onOpenChange={setShowFloorDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar pisos</DialogTitle>
              <DialogDescription>
                Ingresa cuántos pisos deseas agregar
              </DialogDescription>
            </DialogHeader>
            <Form {...floorForm}>
              <form
                onSubmit={floorForm.handleSubmit(handleFloorSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={floorForm.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de piso</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Floor name removed per request */}
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowFloorDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Agregar pisos</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </ClientOnly>
    </div>
  );
}
