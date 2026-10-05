import { TEMPORARY_SIDEBAR_USER } from "@/shared/config/sidebar-user.config";

// TODO: reemplazar por la sesión real (rol guardado tras el login) cuando exista
export function useBackofficeSession() {
  return {
    roleTag: "administrativo" as string | null,
    isLoading: false,
    user: TEMPORARY_SIDEBAR_USER,
  };
}