import {
  BarChart3,
  Building2,
  FileText,
  Home,
  LayoutDashboard,
  Settings,
  Users,
  Plus,
  CheckCircle,
  Clock,
  Eye,
} from "lucide-react";
import type { UserRole } from "@prisma/client";
import type { SidebarData } from "../types";

// Default teams data for different roles
const getDefaultTeams = (role: UserRole) => {
  switch (role) {
    case "SUPER_ADMIN":
      return [
        {
          name: "UbiGroup Platform",
          logo: Building2,
          plan: "Super Admin",
        },
      ];
    case "AGENCY_ADMIN":
      return [
        {
          name: "My Agency",
          logo: Building2,
          plan: "Agency Admin",
        },
      ];
    case "AGENT":
      return [
        {
          name: "My Agency",
          logo: Building2,
          plan: "Agent",
        },
      ];
    default:
      return [
        {
          name: "UbiGroup",
          logo: Building2,
          plan: "Default",
        },
      ];
  }
};

// Base sidebar data that's common to all roles
export const baseSidebarData: Omit<SidebarData, "navGroups"> = {
  user: {
    name: "",
    email: "",
    avatar: "",
  },
  teams: [],
};

// Role-specific navigation configurations
export const getRoleBasedSidebarData = (role: UserRole): SidebarData => {
  const baseNavGroups = [];

  switch (role) {
    case "SUPER_ADMIN":
      baseNavGroups.push(
        {
          title: "Super Admin",
          items: [
            {
              title: "Dashboard",
              url: "/dashboard",
              icon: LayoutDashboard,
            },
            {
              title: "System Analytics",
              url: "/analytics",
              icon: BarChart3,
            },
            {
              title: "User Management",
              url: "/users",
              icon: Users,
            },
          ],
        },
        {
          title: "System Management",
          items: [
            {
              title: "Agency Management",
              url: "/agencies",
              icon: Building2,
            },
            {
              title: "All Properties",
              url: "/all-properties",
              icon: Home,
            },
          ],
        }
      );
      break;

    case "AGENCY_ADMIN":
      baseNavGroups.push(
        {
          title: "Agency Admin",
          items: [
            {
              title: "Dashboard",
              url: "/dashboard",
              icon: LayoutDashboard,
            },
            {
              title: "Agency Analytics",
              url: "/analytics",
              icon: BarChart3,
            },
            {
              title: "Agent Management",
              url: "/agents",
              icon: Users,
            },
          ],
        },
        {
          title: "Property Management",
          items: [
            {
              title: "All Properties",
              url: "/properties",
              icon: Home,
            },
            {
              title: "Pending Approval",
              url: "/properties/pending",
              icon: Clock,
              badge: "new",
            },
            {
              title: "Approved Properties",
              url: "/properties/approved",
              icon: CheckCircle,
            },
          ],
        }
      );
      break;

    case "AGENT":
      baseNavGroups.push(
        {
          title: "Agent",
          items: [
            {
              title: "Dashboard",
              url: "/dashboard",
              icon: LayoutDashboard,
            },
            {
              title: "My Properties",
              url: "/my-properties",
              icon: Home,
            },
            {
              title: "Add Property",
              url: "/properties/create",
              icon: Plus,
            },
          ],
        },
        {
          title: "Property Status",
          items: [
            {
              title: "Pending Review",
              url: "/properties/pending",
              icon: Clock,
            },
            {
              title: "Approved",
              url: "/properties/approved",
              icon: CheckCircle,
            },
            {
              title: "Public View",
              url: "/properties/public",
              icon: Eye,
            },
          ],
        }
      );
      break;
  }

  // Common settings section for all roles
  baseNavGroups.push({
    title: "Account",
    items: [
      {
        title: "Settings",
        url: "/settings",
        icon: Settings,
      },
    ],
  });

  return {
    ...baseSidebarData,
    teams: getDefaultTeams(role),
    navGroups: baseNavGroups,
  };
};

// Default sidebar data (fallback)
export const sidebarData: SidebarData = getRoleBasedSidebarData("AGENT");
