export type RoleTag = "titulado" | "estudiante" | "mentor" | "empresa" | "administrativo";

export interface LoginPayload {
  email: string;
  password: string;
  roleTag: RoleTag;
}

export interface LoginResponse {
  accessToken: string;
  roleTag: RoleTag;
}