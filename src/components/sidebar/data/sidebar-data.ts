import {
  BarChart3,
  Building2,
  Home,
  LayoutDashboard,
  Users,
  CheckCircle,
  Clock,
  Settings,
  UserCog,
  Plus,
  FileText,
  UserPlus,
  Building,
  User,
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
          logo: Building,
          plan: "Super Admin",
        },
      ];
    case "AGENCY_ADMIN":
      return [
        {
          name: "My Agency",
          logo: Building,
          plan: "Agency Admin",
        },
      ];
    case "AGENT":
      return [
        {
          name: "My Agency",
          logo: Building,
          plan: "Agent",
        },
      ];
    default:
      return [
        {
          name: "UbiGroup",
          logo: Building,
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
            {
              title: "System Configuration",
              url: "/system-config",
              icon: Settings,
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
              title: "User Management",
              url: "/users",
              icon: Users,
            },
          ],
        },
        {
          title: "Property Management",
          items: [
            {
              title: "My Properties",
              url: "/my-properties",
              icon: Home,
            },
            {
              title: "Pending Approvals",
              url: "/properties/pending",
              icon: Clock,
            },
            {
              title: "Add Property",
              url: "/properties/create",
              icon: Plus,
            },
          ],
        },
        {
          title: "Agency Settings",
          items: [
            {
              title: "Agency Profile",
              url: "/agency/profile",
              icon: Building2,
            },
            {
              title: "Settings",
              url: "/settings",
              icon: Settings,
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
          title: "Account",
          items: [
            {
              title: "Profile",
              url: "/profile",
              icon: UserCog,
            },
            {
              title: "Settings",
              url: "/settings",
              icon: Settings,
            },
          ],
        }
      );
      break;

    default:
      baseNavGroups.push({
        title: "Navigation",
        items: [
          {
            title: "Dashboard",
            url: "/dashboard",
            icon: LayoutDashboard,
          },
          {
            title: "Properties",
            url: "/properties",
            icon: Home,
          },
        ],
      });
  }

  return {
    ...baseSidebarData,
    teams: getDefaultTeams(role),
    navGroups: baseNavGroups,
  };
};
