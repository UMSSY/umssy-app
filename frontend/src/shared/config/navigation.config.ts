import type { NavigationItem } from '@/shared/types/navigation-item.types';
import { getRouteRoles } from '@/shared/utils/get-route-roles';
import {
  getNotificationInboxPath,
  NOTIFICATION_INBOX_FILTER_LABELS,
  NOTIFICATIONS_INBOX_PATH,
} from '@/modules/notifications';
import { WORKSPACE_SECTIONS } from './workspace-sections.config';
import {
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  History,
  House,
  LayoutGrid,
  MessageCircle,
  Users,
  BriefcaseBusiness,
  Building2,
  Inbox,
  Radar,
  UserRound,
  SlidersHorizontal,
} from 'lucide-react';

function getSectionItems(sectionId: string) {
  return (
    WORKSPACE_SECTIONS.find((section) => section.id === sectionId)?.items.map(
      (item) => ({
        label: item.label,
        href: item.href,
        roles: getRouteRoles(item.href),
      }),
    ) ?? []
  );
}

const notificationRoles = getRouteRoles(NOTIFICATIONS_INBOX_PATH);

export const SIDEBAR_NAVIGATION: NavigationItem[] = [
  {
    label: 'Inicio',
    icon: House,
    href: '/dashboard',
    roles: getRouteRoles('/dashboard'),
  },
  {
    label: 'Mi perfil',
    icon: UserRound,
    activePathPatterns: [/^\/profile(?:\/|$)/],
    children: getSectionItems('profile'),
  },
  {
    label: 'Mentorías',
    icon: Users,
    activePathPatterns: [
      /^\/(?:mentorship|mentors|mentor|appointments)(?:\/|$)/,
    ],
    children: getSectionItems('mentorship'),
  },
  {
    label: 'Talleres y eventos',
    icon: CalendarDays,
    activePathPatterns: [/^\/events(?:\/|$)/],
    children: getSectionItems('events'),
  },
  {
    label: 'Vacantes',
    icon: BriefcaseBusiness,
    activePathPatterns: [/^\/vacancies(?:\/|$)/],
    children: getSectionItems('vacancies'),
  },
  {
    label: 'Mensajes',
    icon: MessageCircle,
    href: '/chat',
    roles: getRouteRoles('/chat'),
  },
  {
    label: 'Notificaciones',
    icon: Bell,
    activePathPatterns: [/^\/notifications(?:\/|$)/],
    children: [
      {
        label: NOTIFICATION_INBOX_FILTER_LABELS.ALL,
        href: getNotificationInboxPath('ALL'),
        roles: notificationRoles,
      },
      {
        label: NOTIFICATION_INBOX_FILTER_LABELS.SURVEYS,
        href: getNotificationInboxPath('SURVEYS'),
        roles: notificationRoles,
      },
      {
        label: NOTIFICATION_INBOX_FILTER_LABELS.REMINDERS,
        href: getNotificationInboxPath('REMINDERS'),
        roles: notificationRoles,
      },
      {
        label: NOTIFICATION_INBOX_FILTER_LABELS.SYSTEM,
        href: getNotificationInboxPath('SYSTEM'),
        roles: notificationRoles,
      },
    ],
  },
  {
    label: 'Mi empresa',
    icon: Building2,
    activePathPatterns: [
      /^\/(?:recruiters|matching)(?:\/|$)/,
      /^\/area-detail(?:-interaction)?-preview\/?$/,
    ],
    children: getSectionItems('company'),
  },
  {
    label: 'Solicitudes',
    icon: Inbox,
    href: '/backoffice/solicitudes',
    roles: getRouteRoles('/backoffice'),
  },
  {
    label: 'Solicitudes de empresas',
    icon: Building2,
    href: '/backoffice/empresas',
    roles: getRouteRoles('/backoffice'),
  },
  {
    label: 'Control de cupos',
    icon: SlidersHorizontal,
    href: '/backoffice/mentor-capacity',
    roles: getRouteRoles('/backoffice'),
  },
  {
    label: 'Revisión de radares',
    icon: Radar,
    href: '/affinity-radar/review-queue',
    roles: getRouteRoles('/affinity-radar/review-queue'),
  },
  {
    label: 'Reportes',
    icon: ChartNoAxesCombined,
    activePathPatterns: [
      /^\/backoffice\/reports(?!\/heatmaps(?:\/|$))(?:\/|$)/,
    ],
    children: getSectionItems('reports'),
  },
  {
    label: 'Mapas de calor',
    icon: LayoutGrid,
    activePathPatterns: [/^\/backoffice\/reports\/heatmaps(?:\/|$)/],
    children: getSectionItems('heatmaps'),
  },
  {
    label: 'Registro de auditoría',
    icon: History,
    href: '/backoffice/audit',
    roles: getRouteRoles('/backoffice/audit'),
  },
  {
    label: 'Encuestas',
    icon: ClipboardList,
    activePathPatterns: [/^\/backoffice\/surveys(?:\/|$)/],
    children: getSectionItems('surveys'),
  },
];
