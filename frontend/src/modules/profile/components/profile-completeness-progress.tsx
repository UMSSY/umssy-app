'use client';

import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PROFILE_COMPLETENESS_LIMITS,
  PROFILE_COMPLETENESS_MESSAGES,
} from '../constants/profile-completeness.constants';
import { useProfileCompleteness } from '../hooks/use-profile-completeness';
import { useProfileCompletenessDisclosure } from '../hooks/use-profile-completeness-disclosure';
import { ProfileCompletenessChecklist } from './profile-completeness-checklist';
import type { ProfileCompletenessProgressProps } from '../types/profile-completeness-progress-props.types';

export function ProfileCompletenessProgress({
  showChecklist = true,
}: ProfileCompletenessProgressProps) {
  const { completeness, isLoading, error, reload } = useProfileCompleteness(showChecklist);
  const isComplete =
    completeness?.percentage === PROFILE_COMPLETENESS_LIMITS.max;
  const { isOpen, panelId, containerRef, triggerRef, toggle } =
    useProfileCompletenessDisclosure(isComplete);

  if (isLoading) {
    return (
      <Card
        role="status"
        aria-busy="true"
        className="justify-center gap-3 bg-surface p-4 shadow-none sm:p-5"
      >
        <p className="text-sm text-text-secondary">
          {PROFILE_COMPLETENESS_MESSAGES.loading}
        </p>
        <Skeleton
          aria-hidden="true"
          className="h-2 w-full motion-reduce:animate-none"
        />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flex-row flex-wrap items-center justify-between gap-3 bg-surface p-4 shadow-none sm:p-5">
        <p role="alert" className="text-sm text-text-secondary">
          {error}
        </p>
        <Button type="button" variant="outline" onClick={() => void reload()}>
          <RotateCcw aria-hidden="true" />
          {PROFILE_COMPLETENESS_MESSAGES.retry}
        </Button>
      </Card>
    );
  }

  if (!completeness) return null;
  const { percentage } = completeness;
  const title = isComplete
    ? PROFILE_COMPLETENESS_MESSAGES.completedTitle
    : percentage === PROFILE_COMPLETENESS_LIMITS.min
      ? PROFILE_COMPLETENESS_MESSAGES.initialTitle
      : PROFILE_COMPLETENESS_MESSAGES.progressTitle;

  return (
    <Card
      ref={containerRef}
      className="@container gap-0 overflow-hidden bg-surface p-0 shadow-none"
    >
      <div className="relative p-4 sm:px-5">
        <Progress
          value={percentage}
          min={PROFILE_COMPLETENESS_LIMITS.min}
          max={PROFILE_COMPLETENESS_LIMITS.max}
          className="gap-3 [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-indicator]]:bg-app-header [&_[data-slot=progress-indicator]]:motion-reduce:transition-none [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:bg-interaction"
        >
          <ProgressLabel className="sr-only">
            {PROFILE_COMPLETENESS_MESSAGES.label}
          </ProgressLabel>
          <div className="flex w-full min-w-0 items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-heading text-lg leading-tight font-bold text-foreground">
                {title}
              </h2>
              <p className="text-xs leading-5 text-text-secondary">
                {isComplete
                  ? PROFILE_COMPLETENESS_MESSAGES.completedDescription
                  : PROFILE_COMPLETENESS_MESSAGES.progressDescription}
              </p>
            </div>
            <ProgressValue className="shrink-0 font-heading text-3xl leading-none font-bold text-app-header">
              {() => `${percentage}%`}
            </ProgressValue>
          </div>
        </Progress>
        {showChecklist && isComplete ? (
          <Button
            ref={triggerRef}
            type="button"
            variant="ghost"
            aria-label={PROFILE_COMPLETENESS_MESSAGES.checklistTrigger}
            aria-expanded={isOpen}
            aria-controls={panelId}
            onClick={toggle}
            className="absolute inset-0 size-full rounded-none hover:bg-transparent focus-visible:ring-app-header focus-visible:ring-inset aria-expanded:bg-transparent"
          />
        ) : null}
      </div>
      {showChecklist ? (
        <div id={panelId} hidden={!isOpen}>
          {isOpen ? (
            <ProfileCompletenessChecklist sections={completeness.sections} />
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
