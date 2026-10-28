"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL_VALUE = "__all__";

interface MentorFiltersBarProps {
  area: string;
  orientation: string;
  technicalAreas: string[];
  orientationTypes: string[];
  onAreaChange: (value: string) => void;
  onOrientationChange: (value: string) => void;
}

export function MentorFiltersBar({
  area,
  orientation,
  technicalAreas,
  orientationTypes,
  onAreaChange,
  onOrientationChange,
}: MentorFiltersBarProps) {
  const areaItems = [
    { value: ALL_VALUE, label: "Todas" },
    ...technicalAreas.map((name) => ({
      value: name,
      label: name,
    })),
  ];

  const orientationItems = [
    { value: ALL_VALUE, label: "Todas" },
    ...orientationTypes.map((name) => ({
      value: name,
      label: name,
    })),
  ];

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mentor-area">Área técnica</Label>
        <Select
          items={areaItems}
          value={area || ALL_VALUE}
          onValueChange={(value) =>
            onAreaChange(value === ALL_VALUE ? "" : (value ?? ""))
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
            onOrientationChange(value === ALL_VALUE ? "" : (value ?? ""))
          }
        >
          <SelectTrigger
            id="mentor-orientation"
            aria-label="Orientación"
            className="max-w-72 min-w-56"
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
