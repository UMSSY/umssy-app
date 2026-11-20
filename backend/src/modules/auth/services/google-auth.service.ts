import { Injectable, Logger } from '@nestjs/common';
import crypto from 'node:crypto';
import { InvalidCredentialsException } from '../exceptions/invalid-credentials.exception.js';

export interface VerifiedGoogleUser {
  email: string;
  sub: string;
  name?: string;
  picture?: string;
}

interface GoogleJwk {
  kty: string;
  alg?: string;
  use?: string;
  kid: string;
  n: string;
  e: string;
}

interface GoogleJwksResponse {
  keys: GoogleJwk[];
}

interface GoogleJwtHeader {
  alg: string;
  kid?: string;
  typ?: string;
}

interface GoogleJwtPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  nbf?: number;
  iat?: number;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  picture?: string;
}

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);
  private cachedKeys: Map<string, GoogleJwk> = new Map();
  private cacheExpiresAt = 0;

  private jwksFetcher: () => Promise<GoogleJwk[]> = async () => {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/certs');
    if (!res.ok) {
      throw new Error(`Error al obtener certificados de Google: HTTP ${res.status}`);
    }
    const data = (await res.json()) as GoogleJwksResponse;
    return data.keys || [];
  };

  /**
   * Allows overriding the JWKS fetcher (useful for unit tests without hitting network).
   */
  setJwksFetcher(fetcher: () => Promise<GoogleJwk[]>): void {
    this.jwksFetcher = fetcher;
    this.cachedKeys.clear();
    this.cacheExpiresAt = 0;
  }

  private async getSigningKey(kid: string): Promise<GoogleJwk | undefined> {
    const now = Date.now();
    if (this.cachedKeys.has(kid) && now < this.cacheExpiresAt) {
      return this.cachedKeys.get(kid);
    }

    try {
      const keys = await this.jwksFetcher();
      this.cachedKeys.clear();
      for (const key of keys) {
        if (key.kid) {
          this.cachedKeys.set(key.kid, key);
        }
      }
      this.cacheExpiresAt = now + 3600 * 1000; // Cache 1 hour
      return this.cachedKeys.get(kid);
    } catch (err) {
      this.logger.error('No se pudieron obtener las claves públicas de Google', err);
      return this.cachedKeys.get(kid);
    }
  }

  /**
   * Verifies Google Identity Services ID Token (JWT).
   * Validates cryptographic signature, issuer, audience, expiration, and email_verified.
   */
  async verifyCredential(credential: string): Promise<VerifiedGoogleUser> {
    const trimmed = credential?.trim();
    if (!trimmed) {
      throw new InvalidCredentialsException('Credencial de Google no proporcionada');
    }

    const parts = trimmed.split('.');
    if (parts.length !== 3) {
      throw new InvalidCredentialsException(
        'Credencial de Google inválida: se requiere un ID Token (JWT) válido',
      );
    }

    return this.verifyIdToken(parts[0], parts[1], parts[2]);
  }

  private async verifyIdToken(
    headerB64: string,
    payloadB64: string,
    signatureB64: string,
  ): Promise<VerifiedGoogleUser> {
    let header: GoogleJwtHeader;
    let payload: GoogleJwtPayload;

    try {
      header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8')) as GoogleJwtHeader;
      payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as GoogleJwtPayload;
    } catch {
      throw new InvalidCredentialsException('Formato de token de Google inválido');
    }

    if (header.alg !== 'RS256') {
      throw new InvalidCredentialsException(`Algoritmo de firma no soportado: ${header.alg}`);
    }

    if (!header.kid) {
      throw new InvalidCredentialsException('El token no incluye el identificador de clave (kid)');
    }

    const jwk = await this.getSigningKey(header.kid);
    if (!jwk) {
      throw new InvalidCredentialsException('No se encontró la clave pública correspondiente al token');
    }

    let publicKey: crypto.KeyObject;
    try {
      publicKey = crypto.createPublicKey({
        key: jwk as unknown as crypto.JsonWebKey,
        format: 'jwk',
      });
    } catch (err) {
      this.logger.error('Error al instanciar clave pública RSA desde JWK', err);
      throw new InvalidCredentialsException('Clave pública de Google malformada');
    }

    const dataToVerify = Buffer.from(`${headerB64}.${payloadB64}`);
    const signature = Buffer.from(signatureB64, 'base64url');

    const isValidSignature = crypto.verify('RSA-SHA256', dataToVerify, publicKey, signature);
    if (!isValidSignature) {
      throw new InvalidCredentialsException('Firma de credencial de Google inválida');
    }

    // Verify Issuer
    const validIssuers = ['https://accounts.google.com', 'accounts.google.com'];
    if (!validIssuers.includes(payload.iss)) {
      throw new InvalidCredentialsException(`Emisor de token de Google inválido: ${payload.iss}`);
    }

    // Verify Expiration
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp <= nowInSeconds) {
      throw new InvalidCredentialsException('La credencial de Google ha expirado');
    }

    // Verify Audience (mandatory: GOOGLE_CLIENT_ID must be configured and match payload.aud)
    const expectedAudience = process.env.GOOGLE_CLIENT_ID?.trim();
    if (!expectedAudience) {
      throw new InvalidCredentialsException(
        'Configuración de autenticación con Google incompleta: GOOGLE_CLIENT_ID no está configurado en el servidor',
      );
    }
    if (payload.aud !== expectedAudience) {
      throw new InvalidCredentialsException('La credencial no corresponde a esta aplicación');
    }

    // Verify Email and Verification status
    const isEmailVerified = payload.email_verified === true || payload.email_verified === 'true';
    if (!payload.email || !isEmailVerified) {
      throw new InvalidCredentialsException('El correo electrónico de Google no está verificado');
    }

    return {
      email: payload.email.trim().toLowerCase(),
      sub: payload.sub,
      name: payload.name,
      picture: payload.picture,
    };
  }
}
