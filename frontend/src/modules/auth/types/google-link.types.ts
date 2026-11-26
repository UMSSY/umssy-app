import type { LoginResponse } from "./auth-types";

export interface GoogleLinkRequest {
  linkToken: string;
  email: string;
  emailVerified: boolean;
}

export type GoogleLoginResult =
  | { success: true; requiresLinking?: false; session: LoginResponse }
  | { success: true; requiresLinking: true; link: GoogleLinkRequest }
  | {
      success: false;
      reason: "not_registered" | "role_not_allowed" | "server_error";
      message: string;
    };

export type GoogleLinkErrorKind =
  | "expired"
  | "already_linked"
  | "role_not_allowed"
  | "server_error";

export type ConfirmGoogleLinkResult =
  | { success: true; session: LoginResponse }
  | { success: false; reason: GoogleLinkErrorKind; message: string };

export type GoogleLinkStatus = "pending" | "linking" | "success" | "error";

export interface GoogleLinkError {
  kind: GoogleLinkErrorKind;
  message: string;
}
