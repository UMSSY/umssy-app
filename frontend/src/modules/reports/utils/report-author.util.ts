import { getRolesLabel, getSessionRoles } from "@/modules/auth";
import { profileService } from "@/modules/profile";
import { getAccessToken } from "@/shared/services/storage/access-token-storage";

const FALLBACK_AUTHOR_NAME = "Administrador";

export async function resolveReportAuthor(): Promise<string> {
  const roleLabel = getRolesLabel(getSessionRoles(getAccessToken()));
  let fullName = "";

  try {
    const profile = await profileService.getProfile();
    fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim();
  } catch {
    fullName = "";
  }

  return `${fullName || FALLBACK_AUTHOR_NAME} (${roleLabel})`;
}
