'use client';
import type { MentorFiltersBarProps } from '../../types/mentor-filters-bar-props.types';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ALL_VALUE = '__all__';

export function MentorFiltersBar({
  area,
  areaAsChips = false,
  orientation,
  technicalAreas,
  orientationTypes,
  onAreaChange,
  onOrientationChange,
}: MentorFiltersBarProps) {
  const areaItems = [
    { value: ALL_VALUE, label: 'Todas' },
    ...technicalAreas.map((name) => ({
      value: name,
      label: name,
    })),
  ];

  const orientationItems = [
    { value: ALL_VALUE, label: 'Todas' },
    ...orientationTypes.map((name) => ({
      value: name,
      label: name,
    })),
  ];

  return (
    <>
      {areaAsChips ? (
        <div
          className="hidden w-full flex-wrap items-center gap-2 min-[1700px]:w-auto sm:flex"
          role="group"
          aria-label="Especialidades"
        >
          <p className="w-full text-[11px] font-semibold tracking-widest text-ink-soft uppercase">Especialidad</p>
          {areaItems.map((item) => (
            <Button
              key={item.value}
              type="button"
              variant="outline"
              aria-pressed={(area || ALL_VALUE) === item.value}
              onClick={() =>
                onAreaChange(item.value === ALL_VALUE ? '' : item.value)
              }
              className="h-[35px] rounded-sm border-border bg-surface px-3 text-[11px] font-normal text-ink-soft aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-foreground"
            >
              {item.value === ALL_VALUE ? 'Todas las áreas' : item.label}
            </Button>
          ))}
        </div>
      ) : null}
      <div
        className={
          areaAsChips
            ? 'flex flex-col gap-1.5 sm:hidden'
            : 'flex flex-col gap-1.5'
        }
      >
        <Label htmlFor="mentor-area">Área técnica</Label>
        <Select
          items={areaItems}
          value={area || ALL_VALUE}
          onValueChange={(value) =>
            onAreaChange(value === ALL_VALUE ? '' : (value ?? ''))
          }
        >
          <SelectTrigger
            id="mentor-area"
            aria-label="Área técnica"
            className="max-w-64 min-w-48"
          >
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {areaItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mentor-orientation">Orientación</Label>
        <Select
          items={orientationItems}
          value={orientation || ALL_VALUE}
          onValueChange={(value) =>
            onOrientationChange(value === ALL_VALUE ? '' : (value ?? ''))
          }
        >
          <SelectTrigger
            id="mentor-orientation"
            aria-label="Orientación"
            className="max-w-56 min-w-36"
          >
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {orientationItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
