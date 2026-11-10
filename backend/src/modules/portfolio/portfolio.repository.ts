import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import type {
  NormalizedPortfolioProject,
  PortfolioPersistenceClient,
  PortfolioProjectDelegate,
  PortfolioProjectEntity,
} from './types/portfolio.types.js';

@Injectable()
export class PortfolioRepository {
  private readonly fallbackStore = new Map<string, PortfolioProjectEntity[]>();

  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<PortfolioProjectEntity[]> {
    const client = this.getPersistenceClient();

    if (client.portfolioProject) {
      const rows = await client.portfolioProject.findMany({
        where: { userId },
        orderBy: { displayOrder: 'asc' },
      });
      return this.sortByDisplayOrder(rows);
    }

    const stored = this.fallbackStore.get(userId) ?? [];
    return this.sortByDisplayOrder(stored.map((item) => ({ ...item })));
  }

  async replaceForUser(
    userId: string,
    projects: readonly NormalizedPortfolioProject[],
  ): Promise<PortfolioProjectEntity[]> {
    const client = this.getPersistenceClient();

    if (client.portfolioProject && client.$transaction) {
      return client.$transaction(async (tx) => {
        const delegate = tx.portfolioProject ?? client.portfolioProject;
        if (!delegate) {
          return this.replaceInFallback(userId, projects);
        }
        return this.replaceWithDelegate(delegate, userId, projects);
      });
    }

    if (client.portfolioProject) {
      return this.replaceWithDelegate(client.portfolioProject, userId, projects);
    }

    return this.replaceInFallback(userId, projects);
  }

  private getPersistenceClient(): PortfolioPersistenceClient {
    return this.prisma as unknown as PortfolioPersistenceClient;
  }

  private async replaceWithDelegate(
    delegate: PortfolioProjectDelegate,
    userId: string,
    projects: readonly NormalizedPortfolioProject[],
  ): Promise<PortfolioProjectEntity[]> {
    await delegate.deleteMany({ where: { userId } });

    const created: PortfolioProjectEntity[] = [];
    for (const project of projects) {
      const entity = await delegate.create({
        data: {
          userId,
          ...project,
        },
      });
      created.push(entity);
    }

    return this.sortByDisplayOrder(created);
  }

  private replaceInFallback(
    userId: string,
    projects: readonly NormalizedPortfolioProject[],
  ): PortfolioProjectEntity[] {
    const saved = projects.map((project) => ({
      id: randomUUID(),
      userId,
      ...project,
    }));
    this.fallbackStore.set(userId, saved);
    return this.sortByDisplayOrder(saved.map((item) => ({ ...item })));
  }

  private sortByDisplayOrder(
    entities: readonly PortfolioProjectEntity[],
  ): PortfolioProjectEntity[] {
    return [...entities].sort(
      (first, second) => first.displayOrder - second.displayOrder,
    );
  }
}

