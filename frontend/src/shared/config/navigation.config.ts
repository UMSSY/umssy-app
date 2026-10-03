import type { NavigationItem } from "@/shared/types/navigation-item.types";
import {
  BriefcaseBusiness,
  CalendarDays,
  House,
  ListChecks,
  UserRound,
} from "lucide-react";

export const SIDEBAR_NAVIGATION: NavigationItem[] = [
  { label: "Inicio", icon: House, href: "/" },
  { label: "Mi perfil", icon: UserRound, href: "/profile" },
  { label: "Empleos", icon: BriefcaseBusiness, href: "/jobs" },
  {
    label: "Mentorías",
    icon: CalendarDays,
    children: [
      {
        label: "Directorio de mentorías",
        href: "/mentorship/mentors",
        icon: ListChecks,
      },
      {
        label: "Mi participación",
        href: "/mentors/participation",
        icon: UserRound,
      },
    ],
  },
];
