"use client";

import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MAX_PORTFOLIO_PROJECTS,
  PORTFOLIO_PROJECTS_MESSAGES,
} from "../constants/portfolio-projects.constants";
import {
  usePortfolioProjects,
  useSyncPortfolioProjects,
} from "../hooks/use-portfolio-projects";
import type { PortfolioProfileSectionProps } from "../types/portfolio-project.types";
import { PortfolioProjectCard } from "./portfolio-project-card";
import { PortfolioSelectionDialog } from "./portfolio-selection-dialog";
import { SectionCard } from "./section-card";

export function PortfolioProfileSection({
  className,
  onAddProjectClick,
}: PortfolioProfileSectionProps) {
  const [isSelectionDialogOpen, setIsSelectionDialogOpen] = useState(false);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const { projects = [], isLoading, isError, refetch } = usePortfolioProjects();
  const syncProjectsMutation = useSyncPortfolioProjects();

  const sortedProjects = [...projects]
    .sort((first, second) => first.displayOrder - second.displayOrder)
    .slice(0, MAX_PORTFOLIO_PROJECTS);

  const displayCount = Math.min(projects.length, MAX_PORTFOLIO_PROJECTS);

  const handleAddClick = () => {
    setIsSelectionDialogOpen(true);
    onAddProjectClick?.();
  };

  const handleSync = () => {
    setSyncErrorMessage(null);
    syncProjectsMutation.mutate(undefined, {
      onError: () => {
        setSyncErrorMessage(PORTFOLIO_PROJECTS_MESSAGES.syncError);
      },
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <p role="status" className="py-3 text-sm text-text-secondary">
          {PORTFOLIO_PROJECTS_MESSAGES.loading}
        </p>
      );
    }

    if (isError) {
      return (
        <div role="alert" className="flex flex-col items-start gap-3 py-3 text-sm text-danger">
          <p>{PORTFOLIO_PROJECTS_MESSAGES.loadError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
          >
            {PORTFOLIO_PROJECTS_MESSAGES.retry}
          </Button>
        </div>
      );
    }

    if (projects.length === 0) {
      return (
        <div className="flex flex-col items-start gap-4 py-3">
          <p className="text-sm text-text-secondary">{PORTFOLIO_PROJECTS_MESSAGES.empty}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedProjects.map((project) => (
          <PortfolioProjectCard key={project.id} project={project} />
        ))}
      </div>
    );
  };

  return (
    <section id="portfolio" aria-label="Portafolio" className={cn("scroll-mt-24 space-y-4", className)}>
      <SectionCard
        title={
          <span className="inline-flex items-center gap-2">
            <span>{PORTFOLIO_PROJECTS_MESSAGES.title}</span>
            <Badge variant="secondary" className="text-xs font-semibold">
              {`${displayCount}/${MAX_PORTFOLIO_PROJECTS}`}
            </Badge>
          </span>
        }
        description={PORTFOLIO_PROJECTS_MESSAGES.description}
        action={
          <div className="flex items-center gap-2">
            {displayCount > 0 ? (
              <Button
                type="button"
                variant="outline"
                className="h-8 gap-2 px-3 text-sm"
                disabled={syncProjectsMutation.isPending}
                onClick={handleSync}
              >
                <RefreshCw
                  className={cn(
                    "size-4",
                    syncProjectsMutation.isPending && "animate-spin",
                  )}
                  aria-hidden="true"
                />
                <span>
                  {syncProjectsMutation.isPending
                    ? PORTFOLIO_PROJECTS_MESSAGES.syncing
                    : PORTFOLIO_PROJECTS_MESSAGES.syncButton}
                </span>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="h-8 gap-2 px-3 text-sm"
              onClick={handleAddClick}
            >
              <Plus className="size-4" aria-hidden="true" />
              <span>{PORTFOLIO_PROJECTS_MESSAGES.addProject}</span>
            </Button>
          </div>
        }
      >
        {syncErrorMessage ? (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between rounded-md border border-critical-action/30 bg-critical-action/10 p-3 text-sm text-critical-action"
          >
            <span>{syncErrorMessage}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-ink hover:bg-surface-soft"
              onClick={() => setSyncErrorMessage(null)}
            >
              Descartar
            </Button>
          </div>
        ) : null}
        {renderContent()}
      </SectionCard>
      <PortfolioSelectionDialog
        open={isSelectionDialogOpen}
        onOpenChange={setIsSelectionDialogOpen}
        currentProjects={sortedProjects}
      />
    </section>
  );
}

