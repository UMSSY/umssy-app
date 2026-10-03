"use client";

import { useState } from "react";

import type { MentorGuidanceType } from "../types/mentor-profile.types";

interface MentorGuidanceTypesProps {
  guidanceTypes: MentorGuidanceType[];
}

export function MentorGuidanceTypes({
  guidanceTypes,
}: MentorGuidanceTypesProps) {
  const [selectedGuidanceId, setSelectedGuidanceId] = useState(
    guidanceTypes[0]?.id,
  );

  if (guidanceTypes.length === 0) {
    return (
      <section className="rounded-xl border border-umssy-border bg-white p-6">
        <h2 className="text-xl font-bold text-umssy-ink">
          Tipos de orientación
        </h2>

        <p className="mt-4 text-umssy-secondary">
          Este mentor todavía no registró tipos de orientación.
        </p>
      </section>
    );
  }

  const selectedGuidance =
    guidanceTypes.find((guidance) => guidance.id === selectedGuidanceId) ??
    guidanceTypes[0];

  return (
    <section className="rounded-xl border border-umssy-border bg-white p-6">
      <h2 className="text-xl font-bold text-umssy-ink">Tipos de orientación</h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {guidanceTypes.map((guidance) => {
          const isSelected = guidance.id === selectedGuidance.id;

          return (
            <button
              key={guidance.id}
              type="button"
              onClick={() => setSelectedGuidanceId(guidance.id)}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                isSelected
                  ? "border-umssy-red bg-umssy-red-soft text-umssy-ink"
                  : "border-umssy-border bg-white text-umssy-secondary hover:bg-umssy-background"
              }`}
            >
              {guidance.name}
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-lg bg-umssy-background p-4">
        <p className="text-sm leading-6 text-umssy-ink">
          {selectedGuidance.description}
        </p>
      </div>
    </section>
  );
}
