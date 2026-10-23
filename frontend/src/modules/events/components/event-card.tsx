'use client';

import { Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import {
  calculateEventCapacityStatus,
  formatEventDate,
  formatTimeRange,
} from '../utils/event-card';
import type { EventCardProps } from '../types/event.types';
import { WorkshopCover } from './workshop-cover';

const categoryBadge = cva('rounded-full px-3 py-1 text-xs font-semibold', {
  variants: {
    category: {
      tecnologia: 'bg-availability text-availability-foreground',
      'ia & datos': 'bg-brand-soft text-ink',
      diseno: 'bg-notice text-notice-foreground',
      seguridad: 'bg-accent text-surface',
      other: 'bg-interaction text-accent',
    },
  },
  defaultVariants: { category: 'other' },
});

export function EventCard({
  event,
  isSelected = false,
  onSelect,
}: EventCardProps) {
  const { enrolledCount, capacity, progressPercentage, isFull } =
    calculateEventCapacityStatus(event);

  const categoryName = event.category.name;
  const normalizedCategory = categoryName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const category =
    normalizedCategory === 'tecnologia' ||
    normalizedCategory === 'ia & datos' ||
    normalizedCategory === 'diseno' ||
    normalizedCategory === 'seguridad'
      ? normalizedCategory
      : 'other';

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(event);
    }
  };

  const handleKeyDown = (
    keyboardEvent: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
      keyboardEvent.preventDefault();
      handleCardClick();
    }
  };

  return (
    <Card className="gap-0 border-0 bg-transparent p-0 shadow-none">
      <Button
        variant="ghost"
        type="button"
        tabIndex={0}
        aria-pressed={isSelected}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex h-auto w-full cursor-pointer flex-col items-stretch justify-between gap-4 rounded-lg border bg-surface p-5 text-left whitespace-normal transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isSelected
            ? 'border-accent bg-interaction ring-1 ring-accent hover:bg-interaction'
            : 'border-border hover:border-border-strong',
        )}
      >
        <WorkshopCover eventId={event.id} className="-mx-5 -mt-5 shrink-0 rounded-t-lg" />
        <div className="flex items-center justify-between gap-2">
          <span className={cn(categoryBadge({ category }))}>
            {categoryName}
          </span>

          {isFull && (
            <span
              data-testid="event-full-badge"
              className="px-3 py-1 text-xs font-semibold text-ink-soft"
            >
              Lleno
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          {isSelected ? <span aria-hidden="true" className="h-0.5 w-8 rounded-full bg-brand-red" /> : null}
          <h2 className="text-base leading-snug font-bold text-ink">
            {event.title}
          </h2>

          <div className="flex flex-col gap-1.5 text-xs text-text-secondary">
            <div className="flex items-center gap-2">
              <Calendar className="size-3.5 shrink-0 text-accent" aria-hidden="true" />
              <span>{formatEventDate(event.eventDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-3.5 shrink-0 text-accent" aria-hidden="true" />
              <span>{formatTimeRange(event.startTime, event.endTime)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          {progressPercentage === null ? (
            <span className="flex-1 text-xs text-text-secondary">
              Sin limite de cupos
            </span>
          ) : (
            <div
              role="progressbar"
              aria-label={`Cupos ocupados para ${event.title}`}
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-2 flex-1 overflow-hidden rounded-full bg-surface-soft"
            >
              <div
                data-testid="event-capacity-bar"
                className={cn(
                  'h-full rounded-full transition-all',
                  'bg-progress',
                )}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
          <span className="shrink-0 text-xs font-medium text-text-secondary">
            {capacity === null
              ? `${enrolledCount} inscritos`
              : `${enrolledCount}/${capacity}`}
          </span>
        </div>
      </Button>
    </Card>
  );
}
