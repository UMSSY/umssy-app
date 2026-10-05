"use client";

import { useState } from "react";
import { Compass } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

import type { MentorGuidanceType } from "../../types/mentor-guidance-type.types";

type MentorGuidanceTypesProps = {
  guidanceTypes: MentorGuidanceType[];
};

export function MentorGuidanceTypes({
  guidanceTypes,
}: MentorGuidanceTypesProps) {
  const [selectedGuidanceId, setSelectedGuidanceId] = useState(
    guidanceTypes[0]?.id,
  );

  if (guidanceTypes.length === 0) {
    return (
      <Card className="gap-0 overflow-visible rounded-xl border border-umssy-border bg-white py-0 text-base ring-0">
        <CardHeader className="px-6 pt-6">
          <CardTitle
            role="heading"
            aria-level={2}
            className="flex items-center gap-2 text-xl font-bold text-umssy-ink"
          >
            <Compass
              className="size-5 shrink-0 text-umssy-red"
              aria-hidden="true"
            />
            Tipos de orientación
          </CardTitle>
        </CardHeader>

        <CardContent className="px-6 pb-6 pt-4">
          <p className="text-umssy-secondary">
            Este mentor todavía no registró tipos de orientación.
          </p>
        </CardContent>
      </Card>
    );
  }

  const selectedGuidance =
    guidanceTypes.find((guidance) => guidance.id === selectedGuidanceId) ??
    guidanceTypes[0];

  return (
    <Card className="gap-0 overflow-visible rounded-xl border border-umssy-border bg-white py-0 text-base ring-0">
      <CardHeader className="px-6 pt-6">
        <CardTitle
          role="heading"
          aria-level={2}
          className="flex items-center gap-2 text-xl font-bold text-umssy-ink"
        >
          <Compass
            className="size-5 shrink-0 text-umssy-red"
            aria-hidden="true"
          />
          Tipos de orientación
        </CardTitle>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-4">
        <ToggleGroup
          multiple={false}
          value={[String(selectedGuidance.id)]}
          onValueChange={(values) => {
            const nextGuidance = guidanceTypes.find(
              (guidance) => String(guidance.id) === values[0],
            );

            if (nextGuidance) {
              setSelectedGuidanceId(nextGuidance.id);
            }
          }}
          variant="outline"
          aria-label="Tipos de orientación"
          className="flex w-full flex-wrap justify-start gap-2"
        >
          {guidanceTypes.map((guidance) => (
            <ToggleGroupItem
              key={guidance.id}
              value={String(guidance.id)}
              className="h-auto cursor-pointer rounded-lg border-umssy-border bg-white px-4 py-2 text-sm font-semibold text-umssy-secondary shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-umssy-red hover:bg-umssy-background hover:shadow-md focus-visible:border-umssy-red focus-visible:ring-umssy-red/30 aria-pressed:border-umssy-red aria-pressed:bg-umssy-red-soft aria-pressed:text-umssy-ink aria-pressed:shadow-md"
            >
              {guidance.name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="mt-5 rounded-lg bg-umssy-background p-4">
          <p className="text-sm leading-6 text-umssy-ink">
            {selectedGuidance.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
