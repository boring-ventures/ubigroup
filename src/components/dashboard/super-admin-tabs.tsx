"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SuperAdminAllProperties } from "./super-admin-all-properties";
import { SuperAdminAllProjects } from "./super-admin-all-projects";

export function SuperAdminTabs() {
  const [activeTab, setActiveTab] = useState("properties");

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full overflow-x-hidden"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="properties">Propiedades</TabsTrigger>
        <TabsTrigger value="projects">Proyectos</TabsTrigger>
      </TabsList>

      <TabsContent value="properties" className="mt-6 overflow-x-hidden">
        <SuperAdminAllProperties />
      </TabsContent>

      <TabsContent value="projects" className="mt-6 overflow-x-hidden">
        <SuperAdminAllProjects />
      </TabsContent>
    </Tabs>
  );
}
