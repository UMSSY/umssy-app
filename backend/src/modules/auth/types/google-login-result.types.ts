import type { GoogleLinkClaims } from './google-link-claims.types.js';
import type { LoginResponse } from './login-response.types.js';

export interface GoogleLinkRequired {
  requiresLinking: true;
  claims: GoogleLinkClaims;
}

export type GoogleLoginResult = LoginResponse | GoogleLinkRequired;
