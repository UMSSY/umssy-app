import type { RoleTag } from "../types/auth-types";

// Espejo del rol administrativo de ROLE_NAMES del backend (el backoffice usa el mismo valor)
export const ADMINISTRATIVE_ROLE_TAG: RoleTag = "administrativo";

export const ROOT_PATH = "/";
export const LOGIN_PATH = "/login";
export const DEFAULT_HOME_PATH = "/profile";
export const BACKOFFICE_HOME_PATH = "/backoffice/solicitudes";
