import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { PortfolioProvider } from '../enums/portfolio-provider.enum.js';
import type { NormalizedPortfolioProject } from '../types/normalized-portfolio-project.type.js';
import type { PortfolioProjectEntity } from '../types/portfolio-project-entity.type.js';

const portfolioProjectSelect = {
  id: true,
  userId: true,
  repoName: true,
  repoUrl: true,
  description: true,
  language: true,
  starsCount: true,
  isOwner: true,
  displayOrder: true,
  provider: {
    select: {
      name: true,
    },
  },
} as const;

type PortfolioProjectSelectedRow = {
  id: string;
  userId: string;
  repoName: string;
  repoUrl: string;
  description: string | null;
  language: string | null;
  starsCount: number;
  isOwner: boolean;
  displayOrder: number;
  provider: {
    name: string;
  };
};

@Injectable()
export class PortfolioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<PortfolioProjectEntity[]> {
    const rows = await this.prisma.userPortfolioProject.findMany({
      where: { userId },
      orderBy: { displayOrder: 'asc' },
      select: portfolioProjectSelect,
    });

    return rows.map((row) => this.toEntity(row));
  }

  async replaceForUser(
    userId: string,
    projects: readonly NormalizedPortfolioProject[],
  ): Promise<PortfolioProjectEntity[]> {
    const rows = await this.prisma.$transaction(async (tx) => {
      await tx.userPortfolioProject.deleteMany({ where: { userId } });

      if (projects.length > 0) {
        const providers = await tx.portfolioProvider.findMany({
          select: { id: true, name: true },
        });
        const providerMap = new Map(providers.map((p) => [p.name, p.id]));

        await tx.userPortfolioProject.createMany({
          data: projects.map((project) => {
            const providerId = providerMap.get(project.provider);
            if (!providerId) {
              throw new Error(`Unknown portfolio provider: ${project.provider}`);
            }
            return {
              userId,
              providerId,
              repoName: project.repoName,
              repoUrl: project.repoUrl,
              description: project.description,
              language: project.language,
              starsCount: project.starsCount,
              isOwner: project.isOwner,
              displayOrder: project.displayOrder,
            };
          }),
        });
      }

      return tx.userPortfolioProject.findMany({
        where: { userId },
        orderBy: { displayOrder: 'asc' },
        select: portfolioProjectSelect,
      });
    });

    return rows.map((row) => this.toEntity(row));
  }

  private toEntity(row: PortfolioProjectSelectedRow): PortfolioProjectEntity {
    return {
      id: row.id,
      userId: row.userId,
      provider: row.provider.name as PortfolioProvider,
      repoName: row.repoName,
      repoUrl: row.repoUrl,
      description: row.description,
      language: row.language,
      starsCount: row.starsCount,
      isOwner: row.isOwner,
      displayOrder: row.displayOrder,
    };
  }
}
