import { BEARER_PREFIX } from "@/shared/constants/auth.constants";
import { getAccessToken } from "@/shared/services/storage/access-token-storage";

export function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `${BEARER_PREFIX}${token}` } : {};
}
