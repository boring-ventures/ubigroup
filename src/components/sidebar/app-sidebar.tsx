"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavGroup } from "./nav-group";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import { getRoleBasedSidebarData } from "./data/sidebar-data";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { NavGroupProps } from "./types";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { profile, isLoading } = useCurrentUser();
  const userRole = profile?.role || "AGENT";
  const sidebarData = getRoleBasedSidebarData(userRole, profile);

  if (isLoading) {
    return (
      <Sidebar collapsible="icon" variant="floating" {...props}>
        <SidebarHeader>
          <div className="p-4 text-sm text-muted-foreground">Loading...</div>
        </SidebarHeader>
        <SidebarContent />
        <SidebarFooter />
        <SidebarRail />
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props: NavGroupProps) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
