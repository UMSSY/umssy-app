"use client";

import { useQuery } from "@tanstack/react-query";
import { profileService } from "@/modules/profile";
import { useCookieSession } from "@/shared/hooks/use-cookie-session";
import { getAccessToken } from "@/shared/services/storage/access-token-storage";

export function useCurrentUserId() {
  const accessToken = getAccessToken();
  const cookieSession = useCookieSession();
  const sessionKey = accessToken ?? (cookieSession ? "cookie" : null);
  const profileQuery = useQuery({
    queryKey: ["mentorship", "current-user", sessionKey],
    queryFn: () => profileService.getProfile(),
    enabled: sessionKey !== null,
    retry: false,
  });

  const currentUserId = profileQuery.data?.id || null;

  return {
    currentUserId,
    canVerifyIdentity:
      sessionKey === null ||
      (profileQuery.isSuccess && !profileQuery.isFetching && currentUserId !== null),
  };
}
