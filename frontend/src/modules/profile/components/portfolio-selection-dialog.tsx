"use client";

import { useMemo, useState } from "react";
import {
  ExternalLink,
  FolderGit2,
  GitBranch,
  Lock,
  Search,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  MAX_PORTFOLIO_PROJECTS,
  PORTFOLIO_SELECTION_MESSAGES,
} from "../constants/portfolio-projects.constants";
import {
  usePortfolioRepositories,
  useUpdatePortfolioProjects,
} from "../hooks/use-portfolio-projects";
import type {
  ExternalRepositoryItem,
  PortfolioProjectItem,
  PortfolioProviderFilter,
  PortfolioSelectionDialogProps,
} from "../types/portfolio-project.types";

const EMPTY_PROJECTS: PortfolioProjectItem[] = [];

export function PortfolioSelectionDialog({
  open,
  onOpenChange,
  currentProjects = EMPTY_PROJECTS,
}: PortfolioSelectionDialogProps) {
  const [prevOpen, setPrevOpen] = useState(open);
  const [providerFilter, setProviderFilter] =
    useState<PortfolioProviderFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRepos, setSelectedRepos] = useState<ExternalRepositoryItem[]>(
    () =>
      currentProjects.map((project) => ({
        provider: project.provider,
        repoName: project.repoName,
        repoUrl: project.repoUrl,
        description: project.description ?? null,
        language: project.language ?? null,
        starsCount: project.starsCount ?? 0,
        isOwner: project.isOwner ?? false,
      })),
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setSelectedRepos(
        currentProjects.map((project) => ({
          provider: project.provider,
          repoName: project.repoName,
          repoUrl: project.repoUrl,
          description: project.description ?? null,
          language: project.language ?? null,
          starsCount: project.starsCount ?? 0,
          isOwner: project.isOwner ?? false,
        })),
      );
      setSearchQuery("");
      setProviderFilter("all");
      setSaveError(null);
    }
  }

  const { repositories, isLoading, isError, refetch } =
    usePortfolioRepositories(open);

  const { mutateAsync: updateProjects, isPending: isSaving } =
    useUpdatePortfolioProjects();

  const isLimitReached = selectedRepos.length >= MAX_PORTFOLIO_PROJECTS;

  const isSelected = (repo: ExternalRepositoryItem) =>
    selectedRepos.some((item) => item.repoUrl === repo.repoUrl);

  const handleToggle = (repo: ExternalRepositoryItem) => {
    if (isSelected(repo)) {
      setSelectedRepos((prev) =>
        prev.filter((item) => item.repoUrl !== repo.repoUrl),
      );
    } else {
      if (selectedRepos.length < MAX_PORTFOLIO_PROJECTS) {
        setSelectedRepos((prev) => [...prev, repo]);
      }
    }
  };

  const filteredRepositories = useMemo(() => {
    const trimmed = (searchQuery ?? "").trim().toLowerCase();
    return repositories.filter((repo) => {
      if (providerFilter !== "all" && repo.provider !== providerFilter) {
        return false;
      }
      if (trimmed.length === 0) {
        return true;
      }
      const nameMatch = (repo.repoName ?? "").toLowerCase().includes(trimmed);
      const descMatch = (repo.description ?? "")
        .toLowerCase()
        .includes(trimmed);
      const langMatch = (repo.language ?? "")
        .toLowerCase()
        .includes(trimmed);
      return nameMatch || descMatch || langMatch;
    });
  }, [repositories, providerFilter, searchQuery]);

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleSave = async () => {
    try {
      setSaveError(null);
      await updateProjects({
        projects: selectedRepos.map((repo) => ({
          provider: repo.provider,
          repoName: (repo.repoName ?? "").trim(),
          repoUrl: (repo.repoUrl ?? "").trim(),
          description: repo.description
            ? (repo.description ?? "").trim()
            : null,
          language: repo.language ? (repo.language ?? "").trim() : null,
          starsCount: repo.starsCount ?? 0,
          isOwner: repo.isOwner ?? false,
        })),
      });
      onOpenChange(false);
    } catch {
      setSaveError(PORTFOLIO_SELECTION_MESSAGES.saveError);
    }
  };

  const renderListContent = () => {
    if (isLoading) {
      return (
        <div
          role="status"
          className="flex min-h-[220px] flex-col items-center justify-center py-10 text-sm text-text-secondary"
        >
          <p>{PORTFOLIO_SELECTION_MESSAGES.loadingRepos}</p>
        </div>
      );
    }

    if (isError) {
      return (
        <div
          role="alert"
          className="flex min-h-[220px] flex-col items-center justify-center gap-3 py-10 text-center text-sm text-danger"
        >
          <p>{PORTFOLIO_SELECTION_MESSAGES.loadReposError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
          >
            {PORTFOLIO_SELECTION_MESSAGES.retry}
          </Button>
        </div>
      );
    }

    if (repositories.length === 0) {
      return (
        <div className="flex min-h-[220px] flex-col items-center justify-center py-10 text-center text-sm text-text-secondary">
          <p>{PORTFOLIO_SELECTION_MESSAGES.emptyRepos}</p>
        </div>
      );
    }

    if (filteredRepositories.length === 0) {
      return (
        <div className="flex min-h-[220px] flex-col items-center justify-center py-10 text-center text-sm text-text-secondary">
          <p>{PORTFOLIO_SELECTION_MESSAGES.noSearchResults}</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2.5">
        {filteredRepositories.map((repo) => {
          const checked = isSelected(repo);
          const disabled = !checked && isLimitReached;
          const isGithub = repo.provider === "github";
          const desc = (repo.description ?? "").trim();
          const lang = (repo.language ?? "").trim();

          return (
            <div
              key={`${repo.provider}-${repo.repoUrl}`}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3.5 transition-colors",
                checked
                  ? "border-primary/50 bg-primary/5 dark:bg-primary/10"
                  : "border-border bg-card hover:bg-muted/30",
                disabled && "opacity-60",
              )}
            >
              <Checkbox
                checked={checked}
                disabled={disabled}
                onCheckedChange={() => handleToggle(repo)}
                aria-label={`Seleccionar ${repo.repoName}`}
                className="mt-1"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {isGithub ? (
                      <FolderGit2
                        className="size-4 shrink-0 text-ink-soft"
                        aria-hidden="true"
                      />
                    ) : (
                      <GitBranch
                        className="size-4 shrink-0 text-ink-soft"
                        aria-hidden="true"
                      />
                    )}
                    <span className="font-semibold [overflow-wrap:anywhere] break-words text-ink">
                      {repo.repoName}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className="text-xs text-text-secondary"
                    >
                      {PORTFOLIO_SELECTION_MESSAGES.publicBadge}
                    </Badge>
                    <Badge
                      variant={repo.isOwner ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {repo.isOwner
                        ? PORTFOLIO_SELECTION_MESSAGES.ownerBadge
                        : PORTFOLIO_SELECTION_MESSAGES.contributorBadge}
                    </Badge>
                  </div>
                </div>

                <p className="line-clamp-2 text-xs text-text-secondary">
                  {desc.length > 0
                    ? desc
                    : PORTFOLIO_SELECTION_MESSAGES.noDescription}
                </p>

                <div className="flex items-center gap-4 text-xs text-text-secondary">
                  {lang.length > 0 && <span>{lang}</span>}
                  <span className="inline-flex items-center gap-1">
                    <Star
                      className="size-3.5 fill-amber-400 text-amber-400"
                      aria-hidden="true"
                    />
                    <span>{repo.starsCount}</span>
                  </span>
                  <a
                    href={repo.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    <span>{PORTFOLIO_SELECTION_MESSAGES.viewRepo}</span>
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[85vh] w-full max-w-2xl flex-col gap-0 p-0 sm:max-w-2xl"
        showCloseButton={!isSaving}
      >
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="text-xl font-bold text-ink">
            {PORTFOLIO_SELECTION_MESSAGES.dialogTitle}
          </DialogTitle>
          <DialogDescription className="text-sm text-text-secondary">
            {PORTFOLIO_SELECTION_MESSAGES.dialogSubtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 border-b border-border px-6 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className="flex items-center gap-1.5"
              role="group"
              aria-label="Filtrar por proveedor"
            >
              <Button
                type="button"
                size="sm"
                variant={providerFilter === "all" ? "default" : "outline"}
                onClick={() => setProviderFilter("all")}
              >
                {PORTFOLIO_SELECTION_MESSAGES.filterAll}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={providerFilter === "github" ? "default" : "outline"}
                onClick={() => setProviderFilter("github")}
              >
                <FolderGit2 className="size-3.5" aria-hidden="true" />
                <span>{PORTFOLIO_SELECTION_MESSAGES.filterGithub}</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant={providerFilter === "gitlab" ? "default" : "outline"}
                onClick={() => setProviderFilter("gitlab")}
              >
                <GitBranch className="size-3.5" aria-hidden="true" />
                <span>{PORTFOLIO_SELECTION_MESSAGES.filterGitlab}</span>
              </Button>
            </div>

            <Badge variant="secondary" className="text-xs font-semibold">
              {PORTFOLIO_SELECTION_MESSAGES.selectedCountBadge(
                selectedRepos.length,
                MAX_PORTFOLIO_PROJECTS,
              )}
            </Badge>
          </div>

          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-secondary"
              aria-hidden="true"
            />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={PORTFOLIO_SELECTION_MESSAGES.searchPlaceholder}
              className="pl-9"
              aria-label={PORTFOLIO_SELECTION_MESSAGES.searchPlaceholder}
            />
          </div>

          {isLimitReached && (
            <div
              role="status"
              className="rounded-md bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400"
            >
              {PORTFOLIO_SELECTION_MESSAGES.maxLimitReached}
            </div>
          )}
        </div>

        <div className="max-h-[380px] min-h-[240px] flex-1 overflow-y-auto px-6 py-4">
          {renderListContent()}
        </div>

        {saveError && (
          <div
            role="alert"
            className="border-t border-danger/20 bg-danger/10 px-6 py-2 text-xs text-danger"
          >
            {saveError}
          </div>
        )}

        <DialogFooter className="-mx-0 -mb-0 flex flex-col-reverse items-center justify-between gap-3 border-t bg-muted/40 p-4 sm:flex-row">
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Lock className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{PORTFOLIO_SELECTION_MESSAGES.authorizedPublicOnly}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              {PORTFOLIO_SELECTION_MESSAGES.cancel}
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving
                ? PORTFOLIO_SELECTION_MESSAGES.saving
                : PORTFOLIO_SELECTION_MESSAGES.saveButton(selectedRepos.length)}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

