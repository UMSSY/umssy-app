export type AccessTokenSource = 'bearer' | 'cookie';

export interface ExtractedAccessToken {
  token: string;
  source: AccessTokenSource;
}
