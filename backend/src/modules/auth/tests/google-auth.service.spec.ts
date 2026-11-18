import { describe, expect, it, beforeEach } from 'vitest';
import crypto from 'node:crypto';
import { GoogleAuthService } from '../services/google-auth.service.js';
import { InvalidCredentialsException } from '../exceptions/invalid-credentials.exception.js';

describe('GoogleAuthService', () => {
  let service: GoogleAuthService;
  let testKeyPair: crypto.KeyPairSyncResult<string, string>;
  let testJwk: Record<string, unknown>;

  beforeEach(() => {
    service = new GoogleAuthService();

    testKeyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const pubKeyObj = crypto.createPublicKey(testKeyPair.publicKey);
    testJwk = {
      ...pubKeyObj.export({ format: 'jwk' }),
      kid: 'valid-test-kid',
      alg: 'RS256',
    };

    service.setJwksFetcher(async () => [testJwk as any]);
    process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
  });

  function createTestJwt(
    payloadOverrides: Record<string, unknown> = {},
    headerOverrides: Record<string, unknown> = {},
    customPrivateKey?: string,
  ): string {
    const header = Buffer.from(
      JSON.stringify({
        alg: 'RS256',
        kid: 'valid-test-kid',
        ...headerOverrides,
      }),
    ).toString('base64url');

    const payload = Buffer.from(
      JSON.stringify({
        iss: 'https://accounts.google.com',
        sub: '10987654321',
        aud: 'test-client-id.apps.googleusercontent.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
        email: 'dania@umss.edu',
        email_verified: true,
        name: 'Dania Gomez',
        ...payloadOverrides,
      }),
    ).toString('base64url');

    const dataToSign = Buffer.from(`${header}.${payload}`);
    const keyToUse = customPrivateKey || testKeyPair.privateKey;
    const sig = crypto
      .sign('RSA-SHA256', dataToSign, keyToUse)
      .toString('base64url');

    return `${header}.${payload}.${sig}`;
  }

  it('verifica exitosamente un ID token válido con firma, emisor, audiencia y expiración correctos', async () => {
    const token = createTestJwt();
    const result = await service.verifyCredential(token);

    expect(result).toEqual({
      email: 'dania@umss.edu',
      sub: '10987654321',
      name: 'Dania Gomez',
      picture: undefined,
    });
  });

  it('rechaza el token si la firma no coincide', async () => {
    const wrongKeyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const tokenWithBadSig = createTestJwt({}, {}, wrongKeyPair.privateKey);

    await expect(service.verifyCredential(tokenWithBadSig)).rejects.toThrow(
      new InvalidCredentialsException('Firma de credencial de Google inválida'),
    );
  });

  it('rechaza el token si ha expirado', async () => {
    const expiredToken = createTestJwt({
      exp: Math.floor(Date.now() / 1000) - 60, // 1 minute in the past
    });

    await expect(service.verifyCredential(expiredToken)).rejects.toThrow(
      new InvalidCredentialsException('La credencial de Google ha expirado'),
    );
  });

  it('rechaza el token si el emisor no es Google', async () => {
    const badIssuerToken = createTestJwt({
      iss: 'https://malicious-issuer.com',
    });

    await expect(service.verifyCredential(badIssuerToken)).rejects.toThrow(
      /Emisor de token de Google inválido/,
    );
  });

  it('rechaza el token si la audiencia no coincide con GOOGLE_CLIENT_ID', async () => {
    const badAudienceToken = createTestJwt({
      aud: 'different-client-id.apps.googleusercontent.com',
    });

    await expect(service.verifyCredential(badAudienceToken)).rejects.toThrow(
      new InvalidCredentialsException(
        'La credencial no corresponde a esta aplicación',
      ),
    );
  });

  it('rechaza el token si el correo no está verificado', async () => {
    const unverifiedToken = createTestJwt({
      email_verified: false,
    });

    await expect(service.verifyCredential(unverifiedToken)).rejects.toThrow(
      new InvalidCredentialsException(
        'El correo electrónico de Google no está verificado',
      ),
    );
  });

  it('rechaza cuando la credencial está vacía o es nula', async () => {
    await expect(service.verifyCredential('')).rejects.toThrow(
      new InvalidCredentialsException(
        'Credencial de Google no proporcionada',
      ),
    );
  });

  it('rechaza cuando la clave pública no existe en Google JWKS', async () => {
    const unknownKidToken = createTestJwt({}, { kid: 'unknown-kid' });

    await expect(service.verifyCredential(unknownKidToken)).rejects.toThrow(
      new InvalidCredentialsException(
        'No se encontró la clave pública correspondiente al token',
      ),
    );
  });

  it('rechaza si GOOGLE_CLIENT_ID no está configurado en el servidor (obligatorio)', async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    const token = createTestJwt();

    await expect(service.verifyCredential(token)).rejects.toThrow(
      new InvalidCredentialsException(
        'Configuración de autenticación con Google incompleta: GOOGLE_CLIENT_ID no está configurado en el servidor',
      ),
    );
  });

  it('rechaza access tokens y formatos que no correspondan a un ID Token de 3 partes', async () => {
    const opaqueAccessToken = 'ya29.a0AXooCgt-fake-access-token-opaque-string';

    await expect(service.verifyCredential(opaqueAccessToken)).rejects.toThrow(
      new InvalidCredentialsException(
        'Credencial de Google inválida: se requiere un ID Token (JWT) válido',
      ),
    );
  });
});
