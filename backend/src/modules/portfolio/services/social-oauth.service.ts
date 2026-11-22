import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { PortfolioProviderEnum } from '../enums/portfolio-provider.enum.js';
import { ExternalProviderUnavailableException } from '../exceptions/external-provider-unavailable.exception.js';
import { OAuthExchangeFailedException } from '../exceptions/oauth-exchange-failed.exception.js';
import { UnsupportedPortfolioProviderException } from '../exceptions/unsupported-portfolio-provider.exception.js';
import { SocialAccountRepository } from '../repositories/social-account.repository.js';
import type { OAuthUrlResponse } from '../responses/oauth-url.response.js';
import type { SocialAccountResponse } from '../responses/social-account.response.js';
import { SocialAccountMapper } from '../mappers/social-account.mapper.js';
import type { ExternalUserProfile } from '../types/external-user-profile.type.js';
import type { PortfolioProvider } from '../types/portfolio-provider.type.js';

const REQUEST_TIMEOUT_MS = 10000;

@Injectable()
export class SocialOAuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly socialAccountRepository: SocialAccountRepository,
    private readonly mapper: SocialAccountMapper,
  ) {}

  getAuthorizationUrl(
    provider: PortfolioProvider,
    state?: string,
    userId?: string,
    challenge?: string,
  ): OAuthUrlResponse {
    if (provider === PortfolioProviderEnum.GITHUB) {
      const clientId = (
        this.configService.get<string>('GITHUB_CLIENT_ID') ?? ''
      ).trim();
      const redirectUri = this.githubCallbackUrl();
      const secret = this.githubStateSecret();
      if (
        !clientId ||
        !this.configService.get<string>('GITHUB_CLIENT_SECRET')?.trim()
      ) {
        throw new ServiceUnavailableException(
          'La conexión con GitHub no está configurada.',
        );
      }
      if (!userId || !challenge || !/^[A-Za-z0-9_-]{43}$/.test(challenge)) {
        throw new BadRequestException(
          'No se pudo iniciar la conexión segura con GitHub.',
        );
      }
      const payload = Buffer.from(
        JSON.stringify({
          userId,
          challenge,
          expires: Date.now() + 10 * 60_000,
          nonce: randomBytes(32).toString('base64url'),
        }),
      ).toString('base64url');
      const signature = createHmac('sha256', secret)
        .update(payload)
        .digest('base64url');

      const params = new URLSearchParams({
        client_id: clientId,
        scope: 'read:user',
        state: `${payload}.${signature}`,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        prompt: 'select_account',
      });
      if (redirectUri) {
        params.set('redirect_uri', redirectUri);
      }
      return {
        url: `https://github.com/login/oauth/authorize?${params.toString()}`,
      };
    }

    if (provider === PortfolioProviderEnum.GITLAB) {
      const clientId = (
        this.configService.get<string>('GITLAB_CLIENT_ID') ?? ''
      ).trim();
      const redirectUri = (
        this.configService.get<string>('GITLAB_CALLBACK_URL') ?? ''
      ).trim();

      const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        scope: 'read_user',
      });
      if (redirectUri) {
        params.set('redirect_uri', redirectUri);
      }
      if (state) {
        params.set('state', (state ?? '').trim());
      }
      return {
        url: `https://gitlab.com/oauth/authorize?${params.toString()}`,
      };
    }

    throw new UnsupportedPortfolioProviderException(provider);
  }

  async connectWithCode(
    userId: string,
    provider: PortfolioProvider,
    code: string,
    state?: string,
    verifier?: string,
  ): Promise<SocialAccountResponse> {
    if (provider === PortfolioProviderEnum.GITHUB)
      this.verifyGithubState(userId, state, verifier);
    const profile = await this.exchangeCodeForProfile(provider, code, verifier);
    const account = await this.socialAccountRepository.upsertAccount({
      userId,
      provider,
      externalId: profile.externalId,
      username: profile.username,
      profileUrl: profile.profileUrl,
    });

    return this.mapper.toResponse(account);
  }

  private async exchangeCodeForProfile(
    provider: PortfolioProvider,
    code: string,
    verifier?: string,
  ): Promise<ExternalUserProfile> {
    if (provider === PortfolioProviderEnum.GITHUB) {
      return this.exchangeGitHub(code, verifier);
    }
    if (provider === PortfolioProviderEnum.GITLAB) {
      return this.exchangeGitLab(code);
    }
    throw new UnsupportedPortfolioProviderException(provider);
  }

  private githubCallbackUrl(): string {
    const explicit = this.configService
      .get<string>('GITHUB_CALLBACK_URL')
      ?.trim();
    if (explicit) return explicit;
    const frontend = this.configService.get<string>('FRONTEND_URL')?.trim();
    if (frontend) {
      try {
        const origin = new URL(frontend);
        if (
          !['http:', 'https:'].includes(origin.protocol) ||
          origin.origin !== frontend.replace(/\/$/, '')
        )
          throw new Error('invalid origin');
        return `${origin.origin}/oauth/github/callback`;
      } catch {
        throw new ServiceUnavailableException(
          'Configure la URL de retorno de GitHub.',
        );
      }
    }
    const origins = (this.configService.get<string>('CORS_ORIGIN') ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
    if (origins.length !== 1)
      throw new ServiceUnavailableException(
        'Configure la URL de retorno de GitHub.',
      );
    try {
      const origin = new URL(origins[0]);
      if (
        !['http:', 'https:'].includes(origin.protocol) ||
        origin.origin !== origins[0].replace(/\/$/, '')
      )
        throw new Error('invalid origin');
      return `${origin.origin}/oauth/github/callback`;
    } catch {
      throw new ServiceUnavailableException(
        'Configure la URL de retorno de GitHub.',
      );
    }
  }

  private githubStateSecret(): string {
    const secret = this.configService.get<string>('JWT_SECRET')?.trim();
    if (!secret)
      throw new ServiceUnavailableException(
        'La conexión con GitHub no está configurada.',
      );
    return secret;
  }

  private verifyGithubState(
    userId: string,
    state?: string,
    verifier?: string,
  ): void {
    const invalid = () =>
      new BadRequestException(
        'La autorización de GitHub es inválida o ha expirado.',
      );
    if (!state || !verifier || !/^[A-Za-z0-9_-]{43,128}$/.test(verifier))
      throw invalid();
    const parts = state.split('.');
    if (
      parts.length !== 2 ||
      !/^[A-Za-z0-9_-]+$/.test(parts[0]) ||
      !/^[A-Za-z0-9_-]{43}$/.test(parts[1])
    )
      throw invalid();
    const actual = Buffer.from(parts[1], 'base64url');
    const expected = createHmac('sha256', this.githubStateSecret())
      .update(parts[0])
      .digest();
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      throw invalid();
    try {
      const payload = JSON.parse(
        Buffer.from(parts[0], 'base64url').toString('utf8'),
      ) as { userId?: unknown; challenge?: unknown; expires?: unknown };
      const challenge = createHash('sha256')
        .update(verifier)
        .digest('base64url');
      if (
        payload.userId !== userId ||
        payload.challenge !== challenge ||
        typeof payload.expires !== 'number' ||
        payload.expires < Date.now()
      )
        throw invalid();
    } catch {
      throw invalid();
    }
  }

  private async exchangeGitHub(
    code: string,
    verifier?: string,
  ): Promise<ExternalUserProfile> {
    const clientId = (
      this.configService.get<string>('GITHUB_CLIENT_ID') ?? ''
    ).trim();
    const clientSecret = (
      this.configService.get<string>('GITHUB_CLIENT_SECRET') ?? ''
    ).trim();
    const redirectUri = this.githubCallbackUrl();

    let tokenResponse: Response;
    try {
      tokenResponse = await fetch(
        'https://github.com/login/oauth/access_token',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'UMSSY-App',
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code: (code ?? '').trim(),
            code_verifier: verifier,
            ...(redirectUri ? { redirect_uri: redirectUri } : {}),
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      );
    } catch {
      throw new ExternalProviderUnavailableException(
        'El servicio de GitHub no está disponible temporalmente',
      );
    }

    if (!tokenResponse.ok) {
      throw new OAuthExchangeFailedException(
        'No se pudo intercambiar el código con GitHub',
      );
    }

    let tokenPayload: unknown;
    try {
      tokenPayload = await tokenResponse.json();
    } catch {
      throw new OAuthExchangeFailedException(
        'Respuesta inválida al intercambiar código con GitHub',
      );
    }

    const tokenData = tokenPayload as { access_token?: string; error?: string };
    if (!tokenData?.access_token || tokenData.error) {
      throw new OAuthExchangeFailedException(
        'Código de autorización de GitHub inválido o expirado',
      );
    }

    const accessToken = tokenData.access_token;

    let userResponse: Response;
    try {
      userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'UMSSY-App',
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new ExternalProviderUnavailableException(
        'El servicio de GitHub no está disponible temporalmente',
      );
    }

    if (!userResponse.ok) {
      throw new OAuthExchangeFailedException(
        'No se pudo obtener el perfil de usuario de GitHub',
      );
    }

    let userPayload: unknown;
    try {
      userPayload = await userResponse.json();
    } catch {
      throw new OAuthExchangeFailedException(
        'Respuesta inválida de perfil de GitHub',
      );
    }

    const userData = userPayload as {
      id?: number | string;
      login?: string;
      html_url?: string;
    };

    if (userData.id === undefined || !userData?.login) {
      throw new OAuthExchangeFailedException(
        'Datos incompletos en el perfil de usuario de GitHub',
      );
    }

    return {
      externalId: String(userData.id),
      username: (userData.login ?? '').trim(),
      profileUrl: userData.html_url ? (userData.html_url ?? '').trim() : null,
    };
  }

  private async exchangeGitLab(code: string): Promise<ExternalUserProfile> {
    const clientId = (
      this.configService.get<string>('GITLAB_CLIENT_ID') ?? ''
    ).trim();
    const clientSecret = (
      this.configService.get<string>('GITLAB_CLIENT_SECRET') ?? ''
    ).trim();
    const redirectUri = (
      this.configService.get<string>('GITLAB_CALLBACK_URL') ?? ''
    ).trim();

    let tokenResponse: Response;
    try {
      tokenResponse = await fetch('https://gitlab.com/oauth/token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'UMSSY-App',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: (code ?? '').trim(),
          grant_type: 'authorization_code',
          ...(redirectUri ? { redirect_uri: redirectUri } : {}),
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new ExternalProviderUnavailableException(
        'El servicio de GitLab no está disponible temporalmente',
      );
    }

    if (!tokenResponse.ok) {
      throw new OAuthExchangeFailedException(
        'No se pudo intercambiar el código con GitLab',
      );
    }

    let tokenPayload: unknown;
    try {
      tokenPayload = await tokenResponse.json();
    } catch {
      throw new OAuthExchangeFailedException(
        'Respuesta inválida al intercambiar código con GitLab',
      );
    }

    const tokenData = tokenPayload as { access_token?: string; error?: string };
    if (!tokenData?.access_token || tokenData.error) {
      throw new OAuthExchangeFailedException(
        'Código de autorización de GitLab inválido o expirado',
      );
    }

    const accessToken = tokenData.access_token;

    let userResponse: Response;
    try {
      userResponse = await fetch('https://gitlab.com/api/v4/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'UMSSY-App',
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new ExternalProviderUnavailableException(
        'El servicio de GitLab no está disponible temporalmente',
      );
    }

    if (!userResponse.ok) {
      throw new OAuthExchangeFailedException(
        'No se pudo obtener el perfil de usuario de GitLab',
      );
    }

    let userPayload: unknown;
    try {
      userPayload = await userResponse.json();
    } catch {
      throw new OAuthExchangeFailedException(
        'Respuesta inválida de perfil de GitLab',
      );
    }

    const userData = userPayload as {
      id?: number | string;
      username?: string;
      web_url?: string;
    };

    if (userData.id === undefined || !userData?.username) {
      throw new OAuthExchangeFailedException(
        'Datos incompletos en el perfil de usuario de GitLab',
      );
    }

    return {
      externalId: String(userData.id),
      username: (userData.username ?? '').trim(),
      profileUrl: userData.web_url ? (userData.web_url ?? '').trim() : null,
    };
  }
}
