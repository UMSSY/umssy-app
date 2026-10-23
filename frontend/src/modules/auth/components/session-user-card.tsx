"use client";

import { useQuery } from "@tanstack/react-query";
import { profileService } from "@/modules/profile";
import { SidebarUserCard } from "@/shared/components/layout/sidebar-user-card";
import { getAccessToken } from "@/shared/services/storage/access-token-storage";
import { useAuth } from "@/shared/contexts/auth-context";
import { getRolesLabel } from "../utils/get-session-role-label";
import { useLogout } from "../hooks/use-logout";

export function SessionUserCard() {
  const handleLogout = useLogout();
  const { roles } = useAuth();
  const accessToken = getAccessToken();
  const { data: profile, isPending } = useQuery({
    queryKey: ["session-profile", accessToken],
    queryFn: () => profileService.getProfile(),
    enabled: Boolean(accessToken),
    retry: false,
  });

  if (!accessToken) return null;

  const fullName = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <SidebarUserCard
      user={{
        fullName: fullName || (isPending ? "Cargando usuario…" : "Usuario"),
        role: getRolesLabel(roles),
      }}
      onLogout={handleLogout}
    />
  );
}
