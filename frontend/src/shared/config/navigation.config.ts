import {
  CalendarDays,
  ChartColumn,
  ClipboardList,
  House,
  ListChecks,
  RadioTower,
  Search,
  User,
  UserRound,
} from "lucide-react";
import type { NavigationEntry } from "@/shared/types/app-sidebar-props.types";

// TODO: Agregar Empleos, Guardados, Contactados, Aprobados, Configuración cuando tengan ruta.

export const SIDEBAR_NAVIGATION: NavigationEntry[] = [
  { label: "Inicio", icon: House, href: "/" },
  { label: "Mi perfil", icon: User, href: "/profile" },
  {
    label: "Mentorías",
    icon: CalendarDays,
    children: [
      {
        label: "Directorio de mentorías",
        href: "/mentorship/mentors",
        icon: ListChecks,
        activePathPatterns: [/^\/mentors\/(?!participation(?:\/|$))[^/]+\/?$/],
      },
      {
        label: "Mi participación",
        href: "/mentors/participation",
        icon: UserRound,
      },
    ],
  },
  {
    label: "Reportes Analíticos",
    icon: ChartColumn,
    children: [
      { label: "Reporte de usuarios registrados", href: "/reports/registered-users" },
      { label: "Reporte de usuarios rechazados", href: "/reports/rejected-users" },
      { label: "Historial de reportes generados", href: "/reports/history" },
    ],
  },
  {
    sectionLabel: "RADAR DE AFINIDAD",
    items: [
      { label: "Radar de afinidad", icon: RadioTower, href: "/affinity-radar/profile" },
      { label: "Cola de revisión", icon: ClipboardList, href: "/affinity-radar/review-queue" },
      { label: "Búsqueda de candidatos", icon: Search, href: "/matching" },
    ],
  },
];
