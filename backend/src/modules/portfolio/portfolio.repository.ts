import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import type {
  NormalizedPortfolioProject,
  PortfolioProjectEntity,
  PortfolioProvider,
} from './types/portfolio.types.js';

const portfolioProjectSelect = {
  id: true,
  userId: true,
  provider: true,
  repoName: true,
  repoUrl: true,
  description: true,
  language: true,
  starsCount: true,
  isOwner: true,
  displayOrder: true,
} as const;

type PortfolioProjectRow = {
  id: string;
  userId: string;
  provider: string;
  repoName: string;
  repoUrl: string;
  description: string | null;
  language: string | null;
  starsCount: number;
  isOwner: boolean;
  displayOrder: number;
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
        await tx.userPortfolioProject.createMany({
          data: projects.map((project) => ({
            userId,
            provider: project.provider,
            repoName: project.repoName,
            repoUrl: project.repoUrl,
            description: project.description,
            language: project.language,
            starsCount: project.starsCount,
            isOwner: project.isOwner,
            displayOrder: project.displayOrder,
          })),
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

  private toEntity(row: PortfolioProjectRow): PortfolioProjectEntity {
    return {
      ...row,
      provider: row.provider as PortfolioProvider,
    };
  }
}
