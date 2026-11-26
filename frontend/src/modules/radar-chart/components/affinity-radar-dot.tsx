'use client';

import { RADAR_TOUCH_TARGET_SIZE } from '../constants/radar-interaction.constants';
import { cn } from '@/lib/utils';
import type { AffinityRadarDotProps } from '../types/affinity-radar-dot-props.types';
import { formatDecimal } from '../utils/format-decimal';

export function AffinityRadarDot({
  area,
  cx,
  cy,
  onAreaClick,
  className,
}: AffinityRadarDotProps) {
  if (cx === undefined || cy === undefined) return null;

  return (
    <g
      data-testid={`radar-dot-${area.id}`}
      onClick={onAreaClick ? () => onAreaClick(area.id) : undefined}
      onKeyDown={
        onAreaClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onAreaClick(area.id);
              }
            }
          : undefined
      }
      role={onAreaClick ? 'button' : undefined}
      tabIndex={onAreaClick ? 0 : undefined}
      aria-label={`Ver evidencias de ${area.name}: ${formatDecimal(area.score, 1)} de 10`}
      className={onAreaClick ? 'group cursor-pointer outline-none' : undefined}
    >
      <title>{`${area.name}: ${formatDecimal(area.score, 1)}`}</title>
      {onAreaClick && (
        <rect
          data-testid={`radar-hit-${area.id}`}
          x={cx - RADAR_TOUCH_TARGET_SIZE / 2}
          y={cy - RADAR_TOUCH_TARGET_SIZE / 2}
          width={RADAR_TOUCH_TARGET_SIZE}
          height={RADAR_TOUCH_TARGET_SIZE}
          fill="transparent"
          pointerEvents="all"
        />
      )}
      <circle
        cx={cx}
        cy={cy}
        r={4.5}
        strokeWidth={2}
        pointerEvents="none"
        className={cn(
          'fill-accent stroke-surface group-hover:[r:6px] group-focus-visible:[r:7px] motion-safe:transition-[r]',
          className,
        )}
      />
    </g>
  );
}
