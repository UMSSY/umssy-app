"use client";

import { useQuery } from "@tanstack/react-query";
import { getRolesLabel } from "@/modules/auth";
import { profileService } from "@/modules/profile";
import { useAuth } from "@/shared/contexts/auth-context";
import { useCookieSession } from "@/shared/hooks/use-cookie-session";
import { getAccessToken } from "@/shared/services/storage/access-token-storage";
import type { SidebarUser } from "@/shared/types/sidebar-user.types";

export function useBackofficeUser(enabled: boolean): SidebarUser {
  const { roles } = useAuth();
  const accessToken = getAccessToken();
  const cookieSession = useCookieSession();
  const sessionKey = accessToken ?? (cookieSession ? "cookie" : null);
  const { data: profile, isPending } = useQuery({
    queryKey: ["session-profile", sessionKey],
    queryFn: () => profileService.getProfile(),
    enabled: enabled && Boolean(sessionKey),
    retry: false,
  });

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim();

  return {
    fullName: fullName || (enabled && isPending ? "Cargando usuario…" : "Personal administrativo"),
    role: getRolesLabel(roles),
  };
}
