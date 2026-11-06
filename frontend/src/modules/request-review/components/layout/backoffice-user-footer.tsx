"use client";

import { SidebarUserCard } from "@/shared/components/layout/sidebar-user-card";
import type { BackofficeUserFooterProps } from "../../types/backoffice-user-footer-props.types";

export function BackofficeUserFooter({ user, onLogout }: BackofficeUserFooterProps) {
  return <SidebarUserCard user={user} onLogout={onLogout} />;
}
