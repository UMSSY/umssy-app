import { describe, expect, it } from 'vitest';
import { PortfolioProjectMapper } from './mappers/portfolio-project.mapper.js';
import type { PortfolioProjectEntity } from './types/portfolio.types.js';

const userId = '11111111-1111-4111-8111-111111111111';

describe('PortfolioProjectMapper', () => {
  const mapper = new PortfolioProjectMapper();

  it('transforms a portfolio project entity into a standardized DTO', () => {
    const entity: PortfolioProjectEntity = {
      id: '22222222-2222-4222-8222-222222222222',
      userId,
      provider: 'github',
      repoName: 'umssy/umssy-app',
      repoUrl: 'https://github.com/umssy/umssy-app',
      description: 'Sistema de egresados UMSS',
      language: 'TypeScript',
      starsCount: 42,
      isOwner: true,
      displayOrder: 0,
    };

    expect(mapper.toDto(entity)).toEqual({
      id: '22222222-2222-4222-8222-222222222222',
      provider: 'github',
      repoName: 'umssy/umssy-app',
      repoUrl: 'https://github.com/umssy/umssy-app',
      description: 'Sistema de egresados UMSS',
      language: 'TypeScript',
      starsCount: 42,
      isOwner: true,
      displayOrder: 0,
    });
  });

  it('maps nullable optional fields consistently and sorts list by displayOrder', () => {
    const second: PortfolioProjectEntity = {
      id: '33333333-3333-4333-8333-333333333333',
      userId,
      provider: 'gitlab',
      repoName: 'grupo-2/ml-service',
      repoUrl: 'https://gitlab.com/grupo-2/ml-service',
      description: null,
      language: null,
      starsCount: 0,
      isOwner: false,
      displayOrder: 2,
    };
    const first: PortfolioProjectEntity = {
      id: '44444444-4444-4444-8444-444444444444',
      userId,
      provider: 'github',
      repoName: 'grupo-2/frontend',
      repoUrl: 'https://github.com/grupo-2/frontend',
      description: 'Frontend Next.js',
      language: 'TypeScript',
      starsCount: 8,
      isOwner: true,
      displayOrder: 1,
    };

    const result = mapper.toDtoList([second, first]);

    expect(result.map((item) => item.id)).toEqual([first.id, second.id]);
    expect(result[1]?.description).toBeNull();
    expect(result[1]?.language).toBeNull();
  });
});

