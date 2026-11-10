import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { DomainException } from '../../common/exceptions/domain.exception.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import {
  DuplicatePortfolioProjectException,
  MaxPortfolioProjectsExceededException,
} from './exceptions/portfolio.exceptions.js';
import { PortfolioProjectMapper } from './mappers/portfolio-project.mapper.js';
import { PortfolioController } from './portfolio.controller.js';
import { PortfolioModule } from './portfolio.module.js';
import { PortfolioRepository } from './portfolio.repository.js';
import { PortfolioService } from './portfolio.service.js';
import { updatePortfolioProjectsSchema } from './requests/update-portfolio-projects.schema.js';

const validProject = {
  provider: 'github' as const,
  repoName: 'umssy/umssy-app',
  repoUrl: 'https://github.com/umssy/umssy-app',
  description: 'Repositorio principal',
  language: 'TypeScript',
  starsCount: 10,
  isOwner: true,
};

describe('updatePortfolioProjectsSchema', () => {
  it('accepts between 0 and 6 valid portfolio projects', () => {
    expect(updatePortfolioProjectsSchema.parse({ projects: [] })).toEqual({
      projects: [],
    });

    const sixProjects = Array.from({ length: 6 }, (_, index) => ({
      ...validProject,
      provider: index % 2 === 0 ? ('github' as const) : ('gitlab' as const),
      repoName: `  owner/repo-${index}  `,
      repoUrl: ` https://gitlab.com/owner/repo-${index} `,
      description: undefined,
      language: null,
    }));

    const parsed = updatePortfolioProjectsSchema.parse({
      projects: sixProjects,
    });
    expect(parsed.projects).toHaveLength(6);
    expect(parsed.projects[0]?.repoName).toBe('owner/repo-0');
    expect(parsed.projects[0]?.repoUrl).toBe(
      'https://gitlab.com/owner/repo-0',
    );
  });

  it.each([
    ['more than 6 projects', { projects: Array.from({ length: 7 }, () => validProject) }],
    ['invalid provider', { projects: [{ ...validProject, provider: 'bitbucket' }] }],
    ['empty repoName', { projects: [{ ...validProject, repoName: '   ' }] }],
    ['repoName over 150 chars', { projects: [{ ...validProject, repoName: 'a'.repeat(151) }] }],
    ['invalid repoUrl', { projects: [{ ...validProject, repoUrl: 'invalid-url' }] }],
    ['non-http repoUrl', { projects: [{ ...validProject, repoUrl: 'ftp://github.com/a/b' }] }],
    ['repoUrl over 500 chars', { projects: [{ ...validProject, repoUrl: `https://github.com/${'a'.repeat(490)}` }] }],
    ['language over 60 chars', { projects: [{ ...validProject, language: 'a'.repeat(61) }] }],
    ['negative starsCount', { projects: [{ ...validProject, starsCount: -1 }] }],
    ['non-integer starsCount', { projects: [{ ...validProject, starsCount: 1.5 }] }],
    ['non-boolean isOwner', { projects: [{ ...validProject, isOwner: 'true' }] }],
  ])('rejects %s', (_case, body) => {
    expect(updatePortfolioProjectsSchema.safeParse(body).success).toBe(false);
  });
});

describe('Portfolio exceptions', () => {
  it('configures 400 status codes and domain codes', () => {
    const maxExceeded = new MaxPortfolioProjectsExceededException();
    const duplicate = new DuplicatePortfolioProjectException();

    expect(maxExceeded).toBeInstanceOf(DomainException);
    expect(maxExceeded.statusCode).toBe(400);
    expect(maxExceeded.code).toBe('MAX_PORTFOLIO_PROJECTS_EXCEEDED');

    expect(duplicate).toBeInstanceOf(DomainException);
    expect(duplicate.statusCode).toBe(400);
    expect(duplicate.code).toBe('DUPLICATE_PORTFOLIO_PROJECT');
  });
});

describe('PortfolioModule', () => {
  it('wires controller, service, repository and mapper', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PortfolioModule, PrismaModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    expect(moduleRef.get(PortfolioController)).toBeDefined();
    expect(moduleRef.get(PortfolioService)).toBeDefined();
    expect(moduleRef.get(PortfolioRepository)).toBeDefined();
    expect(moduleRef.get(PortfolioProjectMapper)).toBeDefined();
  });
});

