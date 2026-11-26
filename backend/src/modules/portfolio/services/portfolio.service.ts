import { Injectable } from '@nestjs/common';
import { MAX_PORTFOLIO_PROJECTS } from '../constants/portfolio.constants.js';
import { PortfolioProviderEnum } from '../enums/portfolio-provider.enum.js';
import { DuplicatePortfolioProjectException } from '../exceptions/duplicate-portfolio-project.exception.js';
import { MaxPortfolioProjectsExceededException } from '../exceptions/max-portfolio-projects-exceeded.exception.js';
import { SocialAccountMapper } from '../mappers/social-account.mapper.js';
import type { SocialAccountDisconnectResponse } from '../responses/social-account-disconnect.response.js';
import type { PortfolioProjectMetadataUpdate } from '../types/portfolio-project-metadata-update.type.js';
import { PortfolioProjectMapper } from '../mappers/portfolio-project.mapper.js';
import { PortfolioRepository } from '../repositories/portfolio.repository.js';
import { SocialAccountRepository } from '../repositories/social-account.repository.js';
import type { GetPortfolioRepositoriesQueryRequest } from '../requests/get-portfolio-repositories-query.schema.js';
import type { PortfolioProjectItemRequest } from '../requests/update-portfolio-projects.schema.js';
import type { ExternalRepositoryResponse } from '../responses/external-repository.response.js';
import type { PortfolioProjectResponse } from '../responses/portfolio-project.response.js';
import type { SocialAccountStatusResponse } from '../responses/social-account-status.response.js';
import type { NormalizedPortfolioProject } from '../types/normalized-portfolio-project.type.js';
import type { PortfolioProvider } from '../types/portfolio-provider.type.js';
import { ProviderRepositoriesService } from './provider-repositories.service.js';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly portfolioRepository: PortfolioRepository,
    private readonly portfolioProjectMapper: PortfolioProjectMapper,
    private readonly socialAccountRepository: SocialAccountRepository,
    private readonly providerRepositoriesService: ProviderRepositoriesService,
    private readonly socialAccountMapper: SocialAccountMapper,
  ) {}

  async getProjects(userId: string): Promise<PortfolioProjectResponse[]> {
    const entities = await this.portfolioRepository.findByUserId(userId);
    return this.portfolioProjectMapper.toResponseList(entities);
  }

  async updateProjects(
    userId: string,
    projects: readonly PortfolioProjectItemRequest[],
  ): Promise<PortfolioProjectResponse[]> {
    if (projects.length > MAX_PORTFOLIO_PROJECTS) {
      throw new MaxPortfolioProjectsExceededException();
    }

    const normalized = this.normalizeAndValidate(projects);
    const saved = await this.portfolioRepository.replaceForUser(
      userId,
      normalized,
    );

    return this.portfolioProjectMapper.toResponseList(saved);
  }

  async getAccounts(userId: string): Promise<SocialAccountStatusResponse[]> {
    const accounts = await this.socialAccountRepository.findByUserId(userId);
    return this.socialAccountMapper.toStatusList(accounts);
  }

  async disconnectSocialAccount(
    userId: string,
    provider: PortfolioProvider,
  ): Promise<SocialAccountDisconnectResponse> {
    await this.socialAccountRepository.disconnect(userId, provider);
    return this.socialAccountMapper.toDisconnectedResponse(provider);
  }

  async syncProjects(userId: string): Promise<PortfolioProjectResponse[]> {
    const savedProjects = await this.portfolioRepository.findByUserId(userId);
    if (savedProjects.length === 0) {
      return [];
    }

    const accounts = await this.socialAccountRepository.findByUserId(userId);
    const accountsByProvider = new Map(
      accounts.map((account) => [account.provider, account]),
    );
    const results = await Promise.all(
      savedProjects.map(async (saved) => {
        const account = accountsByProvider.get(saved.provider);
        if (!account) return null;
        const remote =
          saved.provider === PortfolioProviderEnum.GITHUB
            ? await this.providerRepositoriesService.fetchGitHubRepository(
                saved.repoUrl,
                account.username,
              )
            : await this.providerRepositoriesService.fetchGitLabRepository(
                saved.repoUrl,
                account.username,
              );
        return remote
          ? this.portfolioProjectMapper.toMetadataUpdate(saved.id, remote)
          : null;
      }),
    );
    const updates = results.filter(
      (result): result is PortfolioProjectMetadataUpdate => result !== null,
    );

    const persisted =
      updates.length > 0
        ? await this.portfolioRepository.syncMetadataForUser(userId, updates)
        : await this.portfolioRepository.findByUserId(userId);
    return this.portfolioProjectMapper.toResponseList(persisted);
  }

  async getRepositories(
    userId: string,
    query?: GetPortfolioRepositoriesQueryRequest,
  ): Promise<ExternalRepositoryResponse[]> {
    const accounts = await this.socialAccountRepository.findByUserId(userId);
    if (accounts.length === 0) {
      return [];
    }

    const targetAccounts = query?.provider
      ? accounts.filter((account) => account.provider === query.provider)
      : accounts;

    if (targetAccounts.length === 0) {
      return [];
    }

    const results: ExternalRepositoryResponse[] = [];

    for (const account of targetAccounts) {
      if (account.provider === PortfolioProviderEnum.GITHUB) {
        const repos =
          await this.providerRepositoriesService.fetchGitHubRepositories(
            account.username,
          );
        results.push(...repos);
      } else if (account.provider === PortfolioProviderEnum.GITLAB) {
        const repos =
          await this.providerRepositoriesService.fetchGitLabRepositories(
            account.externalId,
            account.username,
          );
        results.push(...repos);
      }
    }

    const search = (query?.search ?? '').trim().toLowerCase();
    const filtered = search
      ? results.filter((repo) => {
          const nameMatches = (repo.repoName ?? '')
            .toLowerCase()
            .includes(search);
          const descriptionMatches = (repo.description ?? '')
            .toLowerCase()
            .includes(search);
          return nameMatches || descriptionMatches;
        })
      : results;

    return filtered.sort((a, b) => {
      const timeA = new Date(a.updatedAt).getTime();
      const timeB = new Date(b.updatedAt).getTime();
      return timeB - timeA;
    });
  }

  private normalizeAndValidate(
    projects: readonly PortfolioProjectItemRequest[],
  ): NormalizedPortfolioProject[] {
    const seenKeys = new Set<string>();

    return projects.map((project, index) => {
      const repoName = (project.repoName ?? '').trim();
      const repositoryKey = `${project.provider}:${repoName.toLowerCase()}`;

      if (seenKeys.has(repositoryKey)) {
        throw new DuplicatePortfolioProjectException();
      }
      seenKeys.add(repositoryKey);

      return {
        provider: project.provider,
        repoName,
        repoUrl: (project.repoUrl ?? '').trim(),
        description: this.normalizeOptionalText(project.description),
        language: this.normalizeOptionalText(project.language),
        starsCount: project.starsCount,
        isOwner: project.isOwner,
        displayOrder: index,
      };
    });
  }

  private normalizeOptionalText(
    value: string | null | undefined,
  ): string | null {
    const trimmed = (value ?? '').trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}
