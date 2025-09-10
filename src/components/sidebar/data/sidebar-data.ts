import {
  Building2,
  Home,
  LayoutDashboard,
  Users,
  Clock,
  Settings,
  UserCog,
  Building,
  Shield,
  Layers,
  Image,
} from "lucide-react";
import type { UserRole } from "@prisma/client";
import type { SidebarData } from "../types";

type UserWithAgency = {
  id: string;
  userId: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  phone: string | null;
  requiresPasswordChange: boolean;
  agencyId: string | null;
  agency?: {
    id: string;
    name: string;
  } | null;
};

// Default teams data for different roles
const getDefaultTeams = (role: UserRole, user?: UserWithAgency | null) => {
  switch (role) {
    case "SUPER_ADMIN":
      return [
        {
          name: "UbiGroup",
          plan: "Super Admin",
        },
      ];
    case "AGENCY_ADMIN":
      return [
        {
          name: user?.agency?.name || "Mi agencia",
          plan: "Administrador de agencia",
        },
      ];
    case "AGENT":
      return [
        {
          name: user?.agency?.name || "Mi agencia",
          plan: "Agente",
        },
      ];
    default:
      return [
        {
          name: "UbiGroup",
          plan: "Predeterminado",
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
export const getRoleBasedSidebarData = (
  role: UserRole,
  user?: UserWithAgency | null
): SidebarData => {
  const baseNavGroups = [];

  switch (role) {
    case "SUPER_ADMIN":
      baseNavGroups.push(
        {
          title: "Resumen",
          items: [
            {
              title: "Panel",
              url: "/dashboard",
              icon: LayoutDashboard,
            },
          ],
        },
        {
          title: "Gestión",
          items: [
            {
              title: "Usuarios",
              url: "/users",
              icon: Users,
            },
            {
              title: "Agencias",
              url: "/agencies",
              icon: Building2,
            },

            {
              title: "Todas las propiedades",
              url: "/all-properties",
              icon: Home,
            },
          ],
        },
        {
          title: "Sistema",
          items: [
            {
              title: "Configuración",
              url: "/settings",
              icon: Settings,
            },
            {
              title: "Imágenes del Hero",
              url: "/landing-images",
              icon: Image,
            },
          ],
        }
      );
      break;

    case "AGENCY_ADMIN":
      baseNavGroups.push(
        {
          title: "Resumen",
          items: [
            {
              title: "Panel",
              url: "/dashboard",
              icon: LayoutDashboard,
            },
          ],
        },
        {
          title: "Propiedades",
          items: [
            {
              title: "Mis propiedades",
              url: "/my-properties",
              icon: Home,
            },

            {
              title: "Propiedades pendientes",
              url: "/properties/pending",
              icon: Clock,
            },
          ],
        },
        {
          title: "Gestión",
          items: [
            {
              title: "Usuarios",
              url: "/users",
              icon: Users,
            },
          ],
        },
        {
          title: "Cuenta",
          items: [
            {
              title: "Perfil de la agencia",
              url: "/agency/profile",
              icon: Building,
            },
            {
              title: "Configuración",
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
          title: "Resumen",
          items: [
            {
              title: "Panel",
              url: "/dashboard",
              icon: LayoutDashboard,
            },
          ],
        },
        {
          title: "Propiedades",
          items: [
            {
              title: "Mis propiedades",
              url: "/my-properties",
              icon: Home,
            },
          ],
        },
        {
          title: "Proyectos",
          items: [
            {
              title: "Mis proyectos",
              url: "/projects",
              icon: Layers,
            },
          ],
        },
        {
          title: "Cuenta",
          items: [
            {
              title: "Perfil",
              url: "/settings",
              icon: UserCog,
            },
            {
              title: "Configuración",
              url: "/settings",
              icon: Settings,
            },
          ],
        }
      );
      break;

    default:
      baseNavGroups.push({
        title: "Navegación",
        items: [
          {
            title: "Panel",
            url: "/dashboard",
            icon: LayoutDashboard,
          },
          {
            title: "Propiedades",
            url: "/properties",
            icon: Home,
          },
        ],
      });
  }

  return {
    ...baseSidebarData,
    teams: getDefaultTeams(role, user),
    navGroups: baseNavGroups,
  };
};
