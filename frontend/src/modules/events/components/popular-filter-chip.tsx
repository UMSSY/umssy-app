'use client';

import { Button } from '@/components/ui/button';
import { POPULAR_FILTER_LABEL } from '../constants/events.constants';
import type { PopularFilterChipProps } from '../types/popular-filter-chip-props.types';

export function PopularFilterChip({
  isSelected,
  onToggle,
}: PopularFilterChipProps) {
  return (
    <Button
      size="lg"
      variant={isSelected ? 'default' : 'outline'}
      aria-pressed={isSelected}
      onClick={onToggle}
      className="rounded-full px-4 text-xs font-semibold"
    >
      {POPULAR_FILTER_LABEL}
    </Button>
  );
}
