"use client";

import { ExternalLink, FolderGit2, GitBranch, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PORTFOLIO_PROJECTS_MESSAGES } from "../constants/portfolio-projects.constants";
import type { PortfolioProjectCardProps } from "../types/portfolio-project.types";

export function PortfolioProjectCard({ project, className }: PortfolioProjectCardProps) {
  const repoName = (project.repoName ?? "").trim();
  const repoUrl = (project.repoUrl ?? "").trim();
  const description = (project.description ?? "").trim();
  const language = (project.language ?? "").trim();
  const isGithub = project.provider === "github";
  const viewText = isGithub
    ? PORTFOLIO_PROJECTS_MESSAGES.viewOnGithub
    : PORTFOLIO_PROJECTS_MESSAGES.viewOnGitlab;
  const roleBadge = project.isOwner
    ? PORTFOLIO_PROJECTS_MESSAGES.ownerBadge
    : PORTFOLIO_PROJECTS_MESSAGES.contributorBadge;

  return (
    <article
      className={cn(
        "flex h-full flex-col justify-between rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong",
        className,
      )}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {isGithub ? (
              <FolderGit2 className="size-4 shrink-0 text-ink-soft" aria-hidden="true" />
            ) : (
              <GitBranch className="size-4 shrink-0 text-ink-soft" aria-hidden="true" />
            )}
            <h3 className="font-semibold [overflow-wrap:anywhere] break-words text-ink">
              {repoName}
            </h3>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Badge variant="outline" className="text-xs text-text-secondary">
              {PORTFOLIO_PROJECTS_MESSAGES.publicBadge}
            </Badge>
            <Badge
              variant={project.isOwner ? "default" : "secondary"}
              className="text-xs"
            >
              {roleBadge}
            </Badge>
          </div>
        </div>

        <p className="line-clamp-2 text-sm text-text-secondary">
          {description.length > 0 ? description : PORTFOLIO_PROJECTS_MESSAGES.noDescription}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
        <div className="flex items-center gap-3">
          {language.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
              <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
              <span>{language}</span>
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
            <Star className="size-3.5 fill-amber-500/20 text-amber-500" aria-hidden="true" />
            <span>{project.starsCount ?? 0}</span>
          </span>
        </div>

        {repoUrl.length > 0 ? (
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-ink hover:underline"
            title={`${viewText} (${repoName})`}
          >
            <span>{viewText}</span>
            <ExternalLink className="size-3.5 text-text-secondary" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </article>
  );
}
