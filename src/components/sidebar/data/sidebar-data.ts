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
  Shield,
  Cog,
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
          logo: Shield,
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
          title: "Overview",
          items: [
            {
              title: "Dashboard",
              url: "/dashboard",
              icon: LayoutDashboard,
            },
          ],
        },
        {
          title: "Management",
          items: [
            {
              title: "Users",
              url: "/users",
              icon: Users,
            },
            {
              title: "Agencies",
              url: "/agencies",
              icon: Building2,
            },

            {
              title: "All Properties",
              url: "/all-properties",
              icon: Home,
            },
          ],
        },
        {
          title: "System",
          items: [
            {
              title: "Settings",
              url: "/settings",
              icon: Settings,
            },
          ],
        }
      );
      break;

    case "AGENCY_ADMIN":
      baseNavGroups.push(
        {
          title: "Overview",
          items: [
            {
              title: "Dashboard",
              url: "/dashboard",
              icon: LayoutDashboard,
            },
          ],
        },
        {
          title: "Properties",
          items: [
            {
              title: "My Properties",
              url: "/my-properties",
              icon: Home,
            },

            {
              title: "Pending Properties",
              url: "/properties/pending",
              icon: Clock,
            },
          ],
        },
        {
          title: "Management",
          items: [
            {
              title: "Users",
              url: "/users",
              icon: Users,
            },
          ],
        },
        {
          title: "Account",
          items: [
            {
              title: "Agency Profile",
              url: "/agency/profile",
              icon: Building,
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
          title: "Overview",
          items: [
            {
              title: "Dashboard",
              url: "/dashboard",
              icon: LayoutDashboard,
            },
          ],
        },
        {
          title: "Properties",
          items: [
            {
              title: "My Properties",
              url: "/my-properties",
              icon: Home,
            },
          ],
        },
        {
          title: "Account",
          items: [
            {
              title: "Profile",
              url: "/settings",
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
