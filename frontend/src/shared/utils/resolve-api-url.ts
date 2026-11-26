import { ENV_CONFIG } from "@/shared/config/env.config";

export function resolveApiUrl(path: string | null): string | null {
  return path ? `${(ENV_CONFIG.apiUrl ?? "").replace(/\/$/, "")}${path}` : null;
}
