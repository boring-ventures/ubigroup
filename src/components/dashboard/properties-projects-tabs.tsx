"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertiesView } from "./properties-view";
import { ProjectsView } from "./projects-view";

export function PropertiesProjectsTabs() {
  const [activeTab, setActiveTab] = useState("properties");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="properties">Propiedades</TabsTrigger>
        <TabsTrigger value="projects">Proyectos</TabsTrigger>
      </TabsList>

      <TabsContent value="properties" className="mt-6">
        <PropertiesView />
      </TabsContent>

      <TabsContent value="projects" className="mt-6">
        <ProjectsView />
      </TabsContent>
    </Tabs>
  );
}
