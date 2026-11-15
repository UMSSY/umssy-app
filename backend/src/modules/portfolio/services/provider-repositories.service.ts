import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PortfolioProviderEnum } from '../enums/portfolio-provider.enum.js';
import { ExternalProviderUnavailableException } from '../exceptions/external-provider-unavailable.exception.js';
import type { ExternalRepositoryResponse } from '../responses/external-repository.response.js';

interface GitHubRepoDto {
  name?: string;
  html_url?: string;
  description?: string | null;
  language?: string | null;
  stargazers_count?: number;
  private?: boolean;
  owner?: {
    login?: string;
  };
  updated_at?: string;
}

interface GitLabProjectDto {
  name?: string;
  web_url?: string;
  description?: string | null;
  star_count?: number;
  visibility?: string;
  namespace?: {
    kind?: string;
    path?: string;
  };
  last_activity_at?: string;
  updated_at?: string;
}

const REQUEST_TIMEOUT_MS = 10000;

@Injectable()
export class ProviderRepositoriesService {
  constructor(private readonly configService: ConfigService) {}

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

    const repos = payload as GitHubRepoDto[];

    return repos
      .filter((repo) => !repo.private)
      .map((repo) => ({
        provider: PortfolioProviderEnum.GITHUB,
        repoName: (repo.name ?? '').trim(),
        repoUrl: (repo.html_url ?? '').trim(),
        description: repo.description ? (repo.description ?? '').trim() : null,
        language: repo.language ? (repo.language ?? '').trim() : null,
        starsCount:
          typeof repo.stargazers_count === 'number'
            ? repo.stargazers_count
            : 0,
        isOwner: Boolean(
          repo.owner?.login &&
            repo.owner.login.toLowerCase() === cleanUsername.toLowerCase(),
        ),
        updatedAt: this.toIsoDate(repo.updated_at),
      }));
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

    const projects = payload as GitLabProjectDto[];

    return projects
      .filter(
        (project) =>
          !project.visibility || project.visibility.toLowerCase() === 'public',
      )
      .map((project) => ({
        provider: PortfolioProviderEnum.GITLAB,
        repoName: (project.name ?? '').trim(),
        repoUrl: (project.web_url ?? '').trim(),
        description: project.description
          ? (project.description ?? '').trim()
          : null,
        language: null,
        starsCount:
          typeof project.star_count === 'number' ? project.star_count : 0,
        isOwner: Boolean(
          project.namespace?.kind === 'user' ||
            (project.namespace?.path &&
              cleanUsername &&
              project.namespace.path.toLowerCase() ===
                cleanUsername.toLowerCase()),
        ),
        updatedAt: this.toIsoDate(
          project.last_activity_at ?? project.updated_at,
        ),
      }));
  }

  private toIsoDate(dateStr?: string): string {
    if (!dateStr) {
      return new Date().toISOString();
    }
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }
}

