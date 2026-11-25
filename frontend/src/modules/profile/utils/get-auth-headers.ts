import { BEARER_PREFIX } from "@/shared/constants/auth.constants";
import { getAuthToken } from "@/shared/utils/auth-token";

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `${BEARER_PREFIX}${token}` } : {};
}
