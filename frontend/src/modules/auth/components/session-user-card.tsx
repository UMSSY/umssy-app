"use client";

import { useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { profileService } from "@/modules/profile";
import { SidebarUserCard } from "@/shared/components/layout/sidebar-user-card";
import { getAccessToken } from "@/shared/services/storage/access-token-storage";
import {
  hasCookieSession,
  subscribeCookieSession,
} from "@/shared/services/storage/cookie-session-state";
import { useAuth } from "@/shared/contexts/auth-context";
import { getRolesLabel } from "../utils/get-session-role-label";
import { LogoutConfirmDialog } from "./logout-confirm-dialog";

export function SessionUserCard() {
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);
  const { roles, currentUserId, isAuthenticated } = useAuth();
  const accessToken = getAccessToken();
  const cookieSession = useSyncExternalStore(
    subscribeCookieSession,
    hasCookieSession,
    () => false,
  );
  const sessionKey =
    accessToken ??
    currentUserId ??
    (isAuthenticated || cookieSession ? "cookie" : null);

  const { data: profile, isPending } = useQuery({
    queryKey: ["session-profile", sessionKey],
    queryFn: () => profileService.getProfile(),
    enabled: Boolean(sessionKey),
    retry: false,
  });

  if (!sessionKey) return null;

  const fullName = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <>
      <SidebarUserCard
        user={{
          fullName: fullName || (isPending ? "Cargando usuario…" : "Usuario"),
          role: getRolesLabel(roles),
        }}
        onLogout={() => setIsConfirmingLogout(true)}
      />
      <LogoutConfirmDialog open={isConfirmingLogout} onOpenChange={setIsConfirmingLogout} />
    </>
  );
}
