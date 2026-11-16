import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExternalRepositoryMapper } from '../mappers/external-repository.mapper.js';
import type { GitHubRepoDto } from '../types/github-repo-dto.type.js';
import type { GitLabProjectDto } from '../types/gitlab-project-dto.type.js';
import { ExternalProviderUnavailableException } from '../exceptions/external-provider-unavailable.exception.js';
import type { ExternalRepositoryResponse } from '../responses/external-repository.response.js';

const REQUEST_TIMEOUT_MS = 10000;

@Injectable()
export class ProviderRepositoriesService {
  constructor(
    private readonly configService: ConfigService,
    private readonly mapper: ExternalRepositoryMapper,
  ) {}

  async fetchGitHubRepositories(
    username: string,
  ): Promise<ExternalRepositoryResponse[]> {
    const cleanUsername = (username ?? '').trim();
    if (!cleanUsername) {
      return [];
    }

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'UMSSY-App',
    };

    const token = this.configService.get<string>('GITHUB_API_TOKEN');
    if (token && token.trim().length > 0) {
      headers.Authorization = `Bearer ${token.trim()}`;
    }

    const url = `https://api.github.com/users/${encodeURIComponent(cleanUsername)}/repos?type=all&sort=updated&per_page=100`;

    let response: Response;
    try {
      response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new ExternalProviderUnavailableException(
        'El servicio de GitHub no está disponible temporalmente',
      );
    }

    if (!response.ok) {
      throw new ExternalProviderUnavailableException(
        'No se pudieron consultar los repositorios de GitHub',
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new ExternalProviderUnavailableException(
        'Respuesta inválida del servicio de GitHub',
      );
    }

    if (!Array.isArray(payload)) {
      throw new ExternalProviderUnavailableException(
        'Formato inesperado en la respuesta de GitHub',
      );
    }

    return this.mapper.fromGitHub(payload as GitHubRepoDto[], cleanUsername);
  }

  async fetchGitLabRepositories(
    externalId: string,
    username?: string,
  ): Promise<ExternalRepositoryResponse[]> {
    const cleanExternalId = (externalId ?? '').trim();
    const cleanUsername = (username ?? '').trim();

    if (!cleanExternalId && !cleanUsername) {
      return [];
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': 'UMSSY-App',
    };

    const token = this.configService.get<string>('GITLAB_API_TOKEN');
    if (token && token.trim().length > 0) {
      headers.Authorization = `Bearer ${token.trim()}`;
    }

    const identifier = cleanExternalId || cleanUsername;
    const url = `https://gitlab.com/api/v4/users/${encodeURIComponent(identifier)}/projects?visibility=public&per_page=100`;

    let response: Response;
    try {
      response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (response.status === 404 && cleanExternalId && cleanUsername) {
        const fallbackUrl = `https://gitlab.com/api/v4/users/${encodeURIComponent(cleanUsername)}/projects?visibility=public&per_page=100`;
        response = await fetch(fallbackUrl, {
          headers,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      }
    } catch {
      throw new ExternalProviderUnavailableException(
        'El servicio de GitLab no está disponible temporalmente',
      );
    }

    if (!response.ok) {
      throw new ExternalProviderUnavailableException(
        'No se pudieron consultar los proyectos de GitLab',
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new ExternalProviderUnavailableException(
        'Respuesta inválida del servicio de GitLab',
      );
    }

    if (!Array.isArray(payload)) {
      throw new ExternalProviderUnavailableException(
        'Formato inesperado en la respuesta de GitLab',
      );
    }

    return this.mapper.fromGitLab(payload as GitLabProjectDto[], cleanUsername);
  }
}
