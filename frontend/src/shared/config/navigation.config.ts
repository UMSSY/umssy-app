import type { NavigationItem } from "@/shared/types/navigation-item.types";
import { getRouteRoles } from "@/shared/utils/get-route-roles";
import { WORKSPACE_SECTIONS } from "./workspace-sections.config";
import { CalendarDays, ChartNoAxesCombined, House, MessageCircle, Users, BriefcaseBusiness, Building2, Inbox, Radar, UserRound } from "lucide-react";

function getSectionItems(sectionId: string) {
  return WORKSPACE_SECTIONS.find((section) => section.id === sectionId)?.items.map((item) => ({
    label: item.label,
    href: item.href,
    roles: getRouteRoles(item.href),
  })) ?? [];
}

export const SIDEBAR_NAVIGATION: NavigationItem[] = [
  { label: "Inicio", icon: House, href: "/dashboard", roles: getRouteRoles("/dashboard") },
  { label: "Mi perfil", icon: UserRound, activePathPatterns: [/^\/profile(?:\/|$)/], children: getSectionItems("profile") },
  { label: "Mentorías", icon: Users, activePathPatterns: [/^\/(?:mentorship|mentors|mentor)(?:\/|$)/], children: getSectionItems("mentorship") },
  { label: "Talleres y eventos", icon: CalendarDays, activePathPatterns: [/^\/events(?:\/|$)/], children: getSectionItems("events") },
  { label: "Vacantes", icon: BriefcaseBusiness, href: "/vacancies", roles: getRouteRoles("/vacancies") },
  { label: "Mensajes", icon: MessageCircle, href: "/chat", roles: getRouteRoles("/chat") },
  { label: "Mi empresa", icon: Building2, activePathPatterns: [/^\/(?:recruiters|matching)(?:\/|$)/, /^\/area-detail(?:-interaction)?-preview\/?$/], children: getSectionItems("company") },
  { label: "Solicitudes", icon: Inbox, href: "/backoffice/solicitudes", roles: getRouteRoles("/backoffice") },
  { label: "Revisión de radares", icon: Radar, href: "/affinity-radar/review-queue", roles: getRouteRoles("/affinity-radar/review-queue") },
  { label: "Reportes", icon: ChartNoAxesCombined, activePathPatterns: [/^\/backoffice\/reports(?:\/|$)/], children: getSectionItems("reports") },
];
