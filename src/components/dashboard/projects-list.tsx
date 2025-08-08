"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Building2, MapPin, Calendar, Eye } from "lucide-react";
import Link from "next/link";

// Client-side only date formatter to prevent hydration errors
function ClientDateFormatter({ date }: { date: string }) {
  const [formattedDate, setFormattedDate] = useState<string>("");

  React.useEffect(() => {
    setFormattedDate(new Date(date).toLocaleDateString());
  }, [date]);

  return <span>{formattedDate}</span>;
}

interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  propertyType: string;
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
      status: string;
    }[];
  }[];
}

export function ProjectsList() {
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: projects = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["projects", searchQuery],
    queryFn: async (): Promise<Project[]> => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const response = await fetch(`/api/projects?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await response.json();
      return data.projects || [];
    },
  });

  // Removed unused handleDeleteProject to satisfy linter

  const getTotalQuadrants = (floors: Project["floors"]) => {
    return floors.reduce((total, floor) => total + floor.quadrants.length, 0);
  };

  const getStatusCounts = (floors: Project["floors"]) => {
    const counts = { available: 0, unavailable: 0, reserved: 0 };
    floors.forEach((floor) => {
      floor.quadrants.forEach((quadrant) => {
        if (quadrant.status === "AVAILABLE") counts.available++;
        else if (quadrant.status === "UNAVAILABLE") counts.unavailable++;
        else if (quadrant.status === "RESERVED") counts.reserved++;
      });
    });
    return counts;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-destructive mb-4">Failed to load projects</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Button asChild>
          <Link href="/projects/create">
            <Plus className="mr-2 h-4 w-4" />
            Create New Project
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "No projects match your search."
                  : "You haven't created any projects yet."}
              </p>
              {!searchQuery && (
                <Button asChild>
                  <Link href="/projects/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Project
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const totalQuadrants = getTotalQuadrants(project.floors);
            const statusCounts = getStatusCounts(project.floors);

            return (
              <Card
                key={project.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription className="flex items-center mt-2">
                        <MapPin className="mr-1 h-4 w-4" />
                        {project.location}
                      </CardDescription>
                    </div>
                    <Badge variant={project.active ? "default" : "secondary"}>
                      {project.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Property Type:
                      </span>
                      <Badge variant="outline">{project.propertyType}</Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Floors:</span>
                      <span className="font-medium">
                        {project.floors.length}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Total Quadrants:
                      </span>
                      <span className="font-medium">{totalQuadrants}</span>
                    </div>

                    {totalQuadrants > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <div className="flex space-x-1">
                          <Badge variant="default" className="text-xs">
                            {statusCounts.available} Available
                          </Badge>
                          <Badge variant="destructive" className="text-xs">
                            {statusCounts.unavailable} Unavailable
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {statusCounts.reserved} Reserved
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="mr-1 h-3 w-3" />
                      <ClientDateFormatter date={project.createdAt} />
                    </div>

                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/projects/${project.id}`}>
                          <Eye className="h-3 w-3" />
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/projects/${project.id}/edit`}>Edit</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
