import { Injectable } from '@nestjs/common';
import type {
  PortfolioProjectDto,
  PortfolioProjectEntity,
} from '../types/portfolio.types.js';

@Injectable()
export class PortfolioProjectMapper {
  toDto(entity: PortfolioProjectEntity): PortfolioProjectDto {
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

  toDtoList(entities: readonly PortfolioProjectEntity[]): PortfolioProjectDto[] {
    return [...entities]
      .sort((first, second) => first.displayOrder - second.displayOrder)
      .map((entity) => this.toDto(entity));
  }
}

