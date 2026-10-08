import { Dot } from "lucide-react";
import type { NavigationItem } from "@/shared/types/navigation-item.types";

export const RECRUITERS_NAVIGATION: NavigationItem[] = [
  { label: "Inicio", icon: Dot, href: "/recruiters" },
  { label: "Mis vacantes", icon: Dot, href: "/recruiters/jobs" },
  { label: "Registrar nueva vacante", icon: Dot, href: "/recruiters/wizard" },
  { label: "Perfil de empresa", icon: Dot, href: "/recruiters/profile" }
];