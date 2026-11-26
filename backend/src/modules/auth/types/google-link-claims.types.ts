export interface GoogleLinkClaims {
  userId: string;
  googleSub: string;
  email: string;
  picture?: string;
}

export interface GoogleLinkTokenPayload extends GoogleLinkClaims {
  purpose: string;
}
