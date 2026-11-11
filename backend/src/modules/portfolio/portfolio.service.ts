import { Injectable } from '@nestjs/common';
import {
  DuplicatePortfolioProjectException,
  MaxPortfolioProjectsExceededException,
} from './exceptions/portfolio.exceptions.js';
import { PortfolioProjectMapper } from './mappers/portfolio-project.mapper.js';
import { PortfolioRepository } from './portfolio.repository.js';
import {
  MAX_PORTFOLIO_PROJECTS,
  type NormalizedPortfolioProject,
  type PortfolioProjectDto,
  type PortfolioProjectInput,
} from './types/portfolio.types.js';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly portfolioRepository: PortfolioRepository,
    private readonly portfolioProjectMapper: PortfolioProjectMapper,
  ) {}

  async getProjects(userId: string): Promise<PortfolioProjectDto[]> {
    const entities = await this.portfolioRepository.findByUserId(userId);
    return this.portfolioProjectMapper.toDtoList(entities);
  }

  async updateProjects(
    userId: string,
    projects: readonly PortfolioProjectInput[],
  ): Promise<PortfolioProjectDto[]> {
    if (projects.length > MAX_PORTFOLIO_PROJECTS) {
      throw new MaxPortfolioProjectsExceededException();
    }

    const normalized = this.normalizeAndValidate(projects);
    const saved = await this.portfolioRepository.replaceForUser(
      userId,
      normalized,
    );

    return this.portfolioProjectMapper.toDtoList(saved);
  }

  private normalizeAndValidate(
    projects: readonly PortfolioProjectInput[],
  ): NormalizedPortfolioProject[] {
    const seenKeys = new Set<string>();

    return projects.map((project, index) => {
      const repoName = project.repoName.trim();
      const repositoryKey = `${project.provider}:${repoName.toLowerCase()}`;

      if (seenKeys.has(repositoryKey)) {
        throw new DuplicatePortfolioProjectException();
      }
      seenKeys.add(repositoryKey);

      return {
        provider: project.provider,
        repoName,
        repoUrl: project.repoUrl.trim(),
        description: this.normalizeOptionalText(project.description),
        language: this.normalizeOptionalText(project.language),
        starsCount: project.starsCount,
        isOwner: project.isOwner,
        displayOrder: index,
      };
    });
  }

  private normalizeOptionalText(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }
}

