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

export function ProfileCompletenessProgress() {
  const { completeness, isLoading, error, reload } = useProfileCompleteness();

  if (isLoading) {
    return (
      <Card
        role="status"
        aria-busy="true"
        className="min-h-32 justify-center gap-3 bg-surface p-4 shadow-none sm:p-5"
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
      <Card className="min-h-32 flex-row flex-wrap items-center justify-between gap-3 bg-surface p-4 shadow-none sm:p-5">
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
  const isComplete = percentage === PROFILE_COMPLETENESS_LIMITS.max;
  const title = isComplete
    ? PROFILE_COMPLETENESS_MESSAGES.completedTitle
    : percentage === PROFILE_COMPLETENESS_LIMITS.min
      ? PROFILE_COMPLETENESS_MESSAGES.initialTitle
      : PROFILE_COMPLETENESS_MESSAGES.progressTitle;

  return (
    <Card className="min-h-32 justify-center bg-surface p-4 shadow-none sm:p-5">
      <Progress
        value={percentage}
        min={PROFILE_COMPLETENESS_LIMITS.min}
        max={PROFILE_COMPLETENESS_LIMITS.max}
        className="gap-4 [&_[data-slot=progress-indicator]]:bg-app-header [&_[data-slot=progress-indicator]]:motion-reduce:transition-none [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:bg-border"
      >
        <ProgressLabel className="sr-only">
          {PROFILE_COMPLETENESS_MESSAGES.label}
        </ProgressLabel>
        <div className="flex w-full min-w-0 items-center justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h2 className="font-heading text-lg leading-snug font-bold text-foreground">
              {title}
            </h2>
            <p className="text-sm leading-relaxed text-text-secondary">
              {isComplete
                ? PROFILE_COMPLETENESS_MESSAGES.completedDescription
                : PROFILE_COMPLETENESS_MESSAGES.progressDescription}
            </p>
          </div>
          <ProgressValue className="shrink-0 text-3xl leading-none font-semibold text-app-header">
            {() => `${percentage}%`}
          </ProgressValue>
        </div>
      </Progress>
    </Card>
  );
}
