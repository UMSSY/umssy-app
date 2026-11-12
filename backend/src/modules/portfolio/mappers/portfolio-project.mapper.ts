import { Injectable } from '@nestjs/common';
import type { PortfolioProjectEntity } from '../types/portfolio-project-entity.type.js';
import type { PortfolioProjectResponse } from '../responses/portfolio-project.response.js';

@Injectable()
export class PortfolioProjectMapper {
  toResponse(entity: PortfolioProjectEntity): PortfolioProjectResponse {
    return {
      id: entity.id,
      provider: entity.provider,
      repoName: entity.repoName,
      repoUrl: entity.repoUrl,
      description: entity.description ?? null,
      language: entity.language ?? null,
      starsCount: entity.starsCount,
      isOwner: entity.isOwner,
      displayOrder: entity.displayOrder,
    };
  }

  toResponseList(entities: readonly PortfolioProjectEntity[]): PortfolioProjectResponse[] {
    return [...entities]
      .sort((first, second) => first.displayOrder - second.displayOrder)
      .map((entity) => this.toResponse(entity));
  }
}
