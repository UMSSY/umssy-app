import {
  Award,
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  CircleX,
  ClipboardList,
  MessageCircle,
  Radar,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import type { NotificationCatalogDefinition } from "../types/notification-catalog-definition.types";
import type { NotificationType } from "../types/notification-type.types";

export const NOTIFICATION_CATALOG: Record<NotificationType, NotificationCatalogDefinition> = {
  CHAT_MESSAGE: { category: "CHAT", icon: MessageCircle, fallbackPath: "/chat" },
  CHAT_GROUP_MESSAGE: { category: "CHAT", icon: UsersRound, fallbackPath: "/chat" },
  CONNECTION_REQUEST_RECEIVED: { category: "SYSTEM", icon: UserPlus, fallbackPath: "/chat" },
  CONNECTION_REQUEST_ACCEPTED: { category: "SYSTEM", icon: UserCheck, fallbackPath: "/chat" },
  MENTOR_SLOT_OFFERED: { category: "SYSTEM", icon: Award, fallbackPath: "/mentors/participation" },
  RADAR_PUBLISHED: { category: "SYSTEM", icon: Radar, fallbackPath: "/profile/radar" },
  APPOINTMENT_CANCELLED: { category: "REMINDERS", icon: CircleX, fallbackPath: "/appointments" },
  APPOINTMENT_BOOKED: { category: "REMINDERS", icon: CalendarDays, fallbackPath: "/appointments" },
  SURVEY_PUBLISHED: { category: "SURVEYS", icon: ClipboardList, fallbackPath: "/backoffice/surveys" },
  APPLICATION_STATUS_CHANGED: { category: "SYSTEM", icon: BriefcaseBusiness, fallbackPath: "/vacancies/my-applications" },
  NEW_JOB_APPLICANT: { category: "SYSTEM", icon: UserRoundPlus, fallbackPath: "/matching" },
  EVENT_STARTING_SOON: { category: "REMINDERS", icon: CalendarClock, fallbackPath: "/events" },
  ACCESS_REQUEST_APPROVED: { category: "SYSTEM", icon: ShieldCheck, fallbackPath: "/profile" },
};

export const DEFAULT_NOTIFICATION_CATALOG_DEFINITION: NotificationCatalogDefinition = {
  category: "SYSTEM",
  icon: Bell,
  fallbackPath: "/dashboard",
};