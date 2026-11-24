import { Injectable } from '@nestjs/common';
import { PortfolioProviderEnum } from '../enums/portfolio-provider.enum.js';
import type { ExternalRepositoryResponse } from '../responses/external-repository.response.js';
import type { GitHubRepoDto } from '../types/github-repo-dto.type.js';
import type { GitLabProjectDto } from '../types/gitlab-project-dto.type.js';

@Injectable()
export class ExternalRepositoryMapper {
  fromGitHub(repositories: GitHubRepoDto[], username: string): ExternalRepositoryResponse[] {
    return repositories
      .filter((repo) => !repo.private)
      .map((repo) => ({
        provider: PortfolioProviderEnum.GITHUB,
        repoName: (repo.name ?? '').trim(),
        repoUrl: (repo.html_url ?? '').trim(),
        description: repo.description ? repo.description.trim() : null,
        language: repo.language ? repo.language.trim() : null,
        starsCount: typeof repo.stargazers_count === 'number' ? repo.stargazers_count : 0,
        isOwner: Boolean(repo.owner?.login && repo.owner.login.toLowerCase() === username.toLowerCase()),
        updatedAt: this.toIsoDate(repo.updated_at),
      }));
  }

  fromGitLab(projects: GitLabProjectDto[], username: string): ExternalRepositoryResponse[] {
    return projects
      .filter((project) => !project.visibility || project.visibility.toLowerCase() === 'public')
      .map((project) => ({
        provider: PortfolioProviderEnum.GITLAB,
        repoName: (project.name ?? '').trim(),
        repoUrl: (project.web_url ?? '').trim(),
        description: project.description ? project.description.trim() : null,
        language: null,
        starsCount: typeof project.star_count === 'number' ? project.star_count : 0,
        isOwner: Boolean(
          project.namespace?.kind === 'user' ||
          (project.namespace?.path && username && project.namespace.path.toLowerCase() === username.toLowerCase()),
        ),
        updatedAt: this.toIsoDate(project.last_activity_at ?? project.updated_at),
      }));
  }

  private toIsoDate(dateStr?: string): string {
    if (!dateStr) return new Date().toISOString();
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }
}
