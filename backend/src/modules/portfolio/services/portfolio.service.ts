import { Injectable } from '@nestjs/common';
import { MAX_PORTFOLIO_PROJECTS } from '../constants/portfolio.constants.js';
import { DuplicatePortfolioProjectException } from '../exceptions/duplicate-portfolio-project.exception.js';
import { MaxPortfolioProjectsExceededException } from '../exceptions/max-portfolio-projects-exceeded.exception.js';
import { PortfolioProjectMapper } from '../mappers/portfolio-project.mapper.js';
import { PortfolioRepository } from '../repositories/portfolio.repository.js';
import type { PortfolioProjectItemRequest } from '../requests/update-portfolio-projects.schema.js';
import type { PortfolioProjectResponse } from '../responses/portfolio-project.response.js';
import type { NormalizedPortfolioProject } from '../types/normalized-portfolio-project.type.js';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly portfolioRepository: PortfolioRepository,
    private readonly portfolioProjectMapper: PortfolioProjectMapper,
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

  private normalizeAndValidate(
    projects: readonly PortfolioProjectItemRequest[],
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
