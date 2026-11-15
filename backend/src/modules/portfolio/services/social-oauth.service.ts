import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PortfolioProviderEnum } from '../enums/portfolio-provider.enum.js';
import { ExternalProviderUnavailableException } from '../exceptions/external-provider-unavailable.exception.js';
import { OAuthExchangeFailedException } from '../exceptions/oauth-exchange-failed.exception.js';
import { UnsupportedPortfolioProviderException } from '../exceptions/unsupported-portfolio-provider.exception.js';
import { SocialAccountRepository } from '../repositories/social-account.repository.js';
import type { OAuthUrlResponse } from '../responses/oauth-url.response.js';
import type { SocialAccountResponse } from '../responses/social-account.response.js';
import type { PortfolioProvider } from '../types/portfolio-provider.type.js';

interface ExternalUserProfile {
  externalId: string;
  username: string;
  profileUrl: string | null;
}

const REQUEST_TIMEOUT_MS = 10000;

@Injectable()
export class SocialOAuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly socialAccountRepository: SocialAccountRepository,
  ) {}

  getAuthorizationUrl(
    provider: PortfolioProvider,
    state?: string,
  ): OAuthUrlResponse {
    if (provider === PortfolioProviderEnum.GITHUB) {
      const clientId = (
        this.configService.get<string>('GITHUB_CLIENT_ID') ?? ''
      ).trim();
      const redirectUri = (
        this.configService.get<string>('GITHUB_CALLBACK_URL') ?? ''
      ).trim();

      const params = new URLSearchParams({
        client_id: clientId,
        scope: 'read:user',
      });
      if (redirectUri) {
        params.set('redirect_uri', redirectUri);
      }
      if (state) {
        params.set('state', (state ?? '').trim());
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
  ): Promise<SocialAccountResponse> {
    const profile = await this.exchangeCodeForProfile(provider, code);
    const account = await this.socialAccountRepository.upsertAccount({
      userId,
      provider,
      externalId: profile.externalId,
      username: profile.username,
      profileUrl: profile.profileUrl,
    });

    return {
      id: account.id,
      provider: account.provider,
      username: account.username,
      profileUrl: account.profileUrl,
      connected: true,
    };
  }

  private async exchangeCodeForProfile(
    provider: PortfolioProvider,
    code: string,
  ): Promise<ExternalUserProfile> {
    if (provider === PortfolioProviderEnum.GITHUB) {
      return this.exchangeGitHub(code);
    }
    if (provider === PortfolioProviderEnum.GITLAB) {
      return this.exchangeGitLab(code);
    }
    throw new UnsupportedPortfolioProviderException(provider);
  }

  private async exchangeGitHub(code: string): Promise<ExternalUserProfile> {
    const clientId = (
      this.configService.get<string>('GITHUB_CLIENT_ID') ?? ''
    ).trim();
    const clientSecret = (
      this.configService.get<string>('GITHUB_CLIENT_SECRET') ?? ''
    ).trim();
    const redirectUri = (
      this.configService.get<string>('GITHUB_CALLBACK_URL') ?? ''
    ).trim();

    let tokenResponse: Response;
    try {
      tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
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
          ...(redirectUri ? { redirect_uri: redirectUri } : {}),
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
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

