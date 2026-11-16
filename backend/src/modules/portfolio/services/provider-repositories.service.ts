import { PortfolioProviderEnum } from '../enums/portfolio-provider.enum.js';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExternalRepositoryMapper } from '../mappers/external-repository.mapper.js';
import type { GitHubRepoDto } from '../types/github-repo-dto.type.js';
import type { GitLabProjectDto } from '../types/gitlab-project-dto.type.js';
import type { PortfolioProvider } from '../types/portfolio-provider.type.js';
import { ExternalProviderUnavailableException } from '../exceptions/external-provider-unavailable.exception.js';
import type { ExternalRepositoryResponse } from '../responses/external-repository.response.js';

const REQUEST_TIMEOUT_MS = 10000;
const PAGE_SIZE = 100;
const MAX_PAGES = 1000;
const MAX_REDIRECTS = 3;

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
    if (!cleanUsername) return [];
    const url = new URL(
      'https://api.github.com/users/' +
        encodeURIComponent(cleanUsername) +
        '/repos?type=all&sort=updated&per_page=100',
    );
    const payload = await this.fetchPages<GitHubRepoDto>(
      url,
      PortfolioProviderEnum.GITHUB,
    );
    return this.mapRepositories(PortfolioProviderEnum.GITHUB, () =>
      this.mapper.fromGitHub(payload, cleanUsername),
    );
  }

  async fetchGitLabRepositories(
    externalId: string,
    username?: string,
  ): Promise<ExternalRepositoryResponse[]> {
    const cleanExternalId = (externalId ?? '').trim();
    const cleanUsername = (username ?? '').trim();
    if (!cleanExternalId && !cleanUsername) return [];
    const url = new URL(
      'https://gitlab.com/api/v4/users/' +
        encodeURIComponent(cleanExternalId || cleanUsername) +
        '/projects?visibility=public&per_page=100',
    );
    const fallback =
      cleanExternalId && cleanUsername
        ? new URL(
            'https://gitlab.com/api/v4/users/' +
              encodeURIComponent(cleanUsername) +
              '/projects?visibility=public&per_page=100',
          )
        : undefined;
    const payload = await this.fetchPages<GitLabProjectDto>(
      url,
      PortfolioProviderEnum.GITLAB,
      fallback,
    );
    return this.mapRepositories(PortfolioProviderEnum.GITLAB, () =>
      this.mapper.fromGitLab(payload, cleanUsername),
    );
  }

  async fetchGitHubRepository(
    repoUrl: string,
    username: string,
  ): Promise<ExternalRepositoryResponse | null> {
    const path = this.getRepositoryPath(repoUrl, PortfolioProviderEnum.GITHUB);
    if (!path) return null;
    const url = new URL(
      'https://api.github.com/repos/' + path.map(encodeURIComponent).join('/'),
    );
    const payload = await this.fetchSelected<GitHubRepoDto>(
      url,
      PortfolioProviderEnum.GITHUB,
    );
    if (!payload) return null;
    return (
      this.mapRepositories(PortfolioProviderEnum.GITHUB, () =>
        this.mapper.fromGitHub([payload], username.trim()),
      )[0] ?? null
    );
  }

  async fetchGitLabRepository(
    repoUrl: string,
    username: string,
  ): Promise<ExternalRepositoryResponse | null> {
    const path = this.getRepositoryPath(repoUrl, PortfolioProviderEnum.GITLAB);
    if (!path) return null;
    const url = new URL(
      'https://gitlab.com/api/v4/projects/' +
        encodeURIComponent(path.join('/')),
    );
    const payload = await this.fetchSelected<GitLabProjectDto>(
      url,
      PortfolioProviderEnum.GITLAB,
    );
    if (!payload) return null;
    return (
      this.mapRepositories(PortfolioProviderEnum.GITLAB, () =>
        this.mapper.fromGitLab([payload], username.trim()),
      )[0] ?? null
    );
  }

  private async fetchPages<T>(
    baseUrl: URL,
    provider: PortfolioProvider,
    fallback?: URL,
  ): Promise<T[]> {
    const result: T[] = [];
    let page = 1;
    let endpoint = baseUrl;
    while (page <= MAX_PAGES) {
      const url = new URL(endpoint);
      if (page > 1) url.searchParams.set('page', String(page));
      let response = await this.request(url, provider);
      if (page === 1 && response.status === 404 && fallback) {
        endpoint = fallback;
        response = await this.request(endpoint, provider);
      }
      if (!response.ok) throw this.unavailable(provider);
      const payload = await this.readPayload(response, provider);
      if (
        !Array.isArray(payload) ||
        payload.some((item) => !this.isObject(item))
      )
        throw this.unavailable(provider);
      result.push(...(payload as T[]));
      const next = this.getNextPage(
        response,
        endpoint,
        page,
        payload.length,
        provider,
      );
      if (next === null) return result;
      page = next;
    }
    throw this.unavailable(provider);
  }

  private async fetchSelected<T>(
    url: URL,
    provider: PortfolioProvider,
  ): Promise<T | null> {
    const response = await this.request(url, provider);
    if (response.status === 404 || response.status === 403) return null;
    if (!response.ok) throw this.unavailable(provider);
    const payload = await this.readPayload(response, provider);
    if (!this.isObject(payload)) throw this.unavailable(provider);
    return payload as T;
  }

  private async request(
    url: URL,
    provider: PortfolioProvider,
  ): Promise<Response> {
    const headers: Record<string, string> = {
      Accept:
        provider === PortfolioProviderEnum.GITHUB
          ? 'application/vnd.github+json'
          : 'application/json',
      'User-Agent': 'UMSSY-App',
    };
    const token = this.configService.get<string>(
      provider === PortfolioProviderEnum.GITHUB
        ? 'GITHUB_API_TOKEN'
        : 'GITLAB_API_TOKEN',
    );
    if (token?.trim()) headers.Authorization = 'Bearer ' + token.trim();
    const visited = new Set<string>();
    const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    let current = url;
    try {
      for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
        if (
          !this.isAllowedApiUrl(current, provider) ||
          visited.has(current.href)
        )
          throw this.unavailable(provider);
        visited.add(current.href);
        const response = await fetch(current.href, {
          headers,
          signal,
          redirect: 'manual',
        });
        if (![301, 302, 303, 307, 308].includes(response.status))
          return response;
        const location = response.headers?.get('location');
        if (!location) throw this.unavailable(provider);
        current = new URL(location, current);
      }
    } catch {
      throw this.unavailable(provider);
    }
    throw this.unavailable(provider);
  }

  private getNextPage(
    response: Response,
    endpoint: URL,
    page: number,
    size: number,
    provider: PortfolioProvider,
  ): number | null {
    const link = response.headers?.get('link');
    const nextLink = link
      ?.split(',')
      .find((part) => /;\s*rel=["']?next["']?(?:\s|;|$)/i.test(part));
    if (nextLink) {
      const match = /<([^>]+)>/.exec(nextLink);
      if (!match) throw this.unavailable(provider);
      let nextUrl: URL;
      try {
        nextUrl = new URL(match[1], endpoint);
      } catch {
        throw this.unavailable(provider);
      }
      if (
        !this.isAllowedApiUrl(nextUrl, provider) ||
        nextUrl.origin !== endpoint.origin ||
        nextUrl.pathname !== endpoint.pathname
      )
        throw this.unavailable(provider);
      return this.parseNextPage(
        nextUrl.searchParams.get('page'),
        page,
        provider,
      );
    }
    const header = response.headers?.get('x-next-page');
    if (header !== null && header !== undefined)
      return header.trim() ? this.parseNextPage(header, page, provider) : null;
    return size >= PAGE_SIZE ? page + 1 : null;
  }

  private parseNextPage(
    value: string | null,
    current: number,
    provider: PortfolioProvider,
  ): number {
    const page = Number(value);
    if (
      !value ||
      !/^\d+$/.test(value) ||
      !Number.isSafeInteger(page) ||
      page <= current ||
      page > MAX_PAGES
    )
      throw this.unavailable(provider);
    return page;
  }

  private getRepositoryPath(
    value: string,
    provider: PortfolioProvider,
  ): string[] | null {
    try {
      const url = new URL(value);
      if (
        url.origin !==
          (provider === PortfolioProviderEnum.GITHUB
            ? 'https://github.com'
            : 'https://gitlab.com') ||
        url.username ||
        url.password
      )
        return null;
      const path = url.pathname
        .replace(/\/$/, '')
        .slice(1)
        .split('/')
        .map((segment) => decodeURIComponent(segment));
      if (
        path.length < 2 ||
        (provider === PortfolioProviderEnum.GITHUB && path.length !== 2) ||
        path.some(
          (segment) =>
            !segment ||
            segment === '.' ||
            segment === '..' ||
            segment === '-' ||
            /[\\/?#]/.test(segment),
        )
      )
        return null;
      return path;
    } catch {
      return null;
    }
  }

  private isAllowedApiUrl(url: URL, provider: PortfolioProvider): boolean {
    return (
      !url.username &&
      !url.password &&
      (provider === PortfolioProviderEnum.GITHUB
        ? url.origin === 'https://api.github.com'
        : url.origin === 'https://gitlab.com' &&
          url.pathname.startsWith('/api/v4/'))
    );
  }

  private async readPayload(
    response: Response,
    provider: PortfolioProvider,
  ): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      throw this.unavailable(provider);
    }
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  private mapRepositories(
    provider: PortfolioProvider,
    map: () => ExternalRepositoryResponse[],
  ): ExternalRepositoryResponse[] {
    try {
      const result = map();
      if (
        result.some(
          (repo) =>
            !repo.repoName || !this.getRepositoryPath(repo.repoUrl, provider),
        )
      )
        throw this.unavailable(provider);
      return result;
    } catch {
      throw this.unavailable(provider);
    }
  }

  private unavailable(
    provider: PortfolioProvider,
  ): ExternalProviderUnavailableException {
    return new ExternalProviderUnavailableException(
      provider === PortfolioProviderEnum.GITHUB
        ? 'No se pudieron consultar los repositorios de GitHub'
        : 'No se pudieron consultar los proyectos de GitLab',
    );
  }
}
