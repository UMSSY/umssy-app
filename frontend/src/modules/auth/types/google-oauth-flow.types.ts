export interface GoogleOAuthRequestOptions {
  intent?: 'login' | 'link';
  accountEmail?: string;
}

export interface PendingGoogleOAuthRequest {
  state: string;
  nonce: string;
  createdAt: number;
  intent: 'login' | 'link';
  accountEmail: string | null;
  nextPath: string | null;
}

export interface GoogleOAuthProfile {
  email: string;
  name?: string;
  picture?: string;
  idToken: string;
  credential: string;
}

export type GoogleOAuthCallbackResult =
  | { kind: 'popup' }
  | {
      kind: 'redirect';
      request: PendingGoogleOAuthRequest;
      profile: GoogleOAuthProfile;
    };
