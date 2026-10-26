"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrientationTypeResponse } from "../../types/orientation-type-response.types";
import type { TechnicalAreaResponse } from "../../types/technical-area-response.types";

const ALL_VALUE = "__all__";

interface MentorFiltersBarProps {
  area: string;
  orientation: string;
  technicalAreas: TechnicalAreaResponse[];
  orientationTypes: OrientationTypeResponse[];
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
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mentor-area">Área técnica</Label>
        <Select
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
            <SelectItem value={ALL_VALUE}>Todas</SelectItem>
            {technicalAreas.map((areaOption) => (
              <SelectItem key={areaOption.id} value={areaOption.name}>
                {areaOption.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mentor-orientation">Orientación</Label>
        <Select
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
            <SelectItem value={ALL_VALUE}>Todas</SelectItem>
            {orientationTypes.map((orientationOption) => (
              <SelectItem
                key={orientationOption.id}
                value={orientationOption.name}
              >
                {orientationOption.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
