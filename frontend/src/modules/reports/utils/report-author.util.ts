import { getRolesLabel, getSessionRoles } from "@/modules/auth";
import { profileService } from "@/modules/profile";
import { getAccessToken } from "@/shared/services/storage/access-token-storage";

export async function resolveReportAuthor(): Promise<string> {
  const roleLabel = getRolesLabel(getSessionRoles(getAccessToken()));
  const profile = await profileService.getProfile();
  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim();

  if (!fullName) throw new Error("No se pudo identificar al administrador que genera el reporte.");

  return `${fullName} (${roleLabel})`;
}
