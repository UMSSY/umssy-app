"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  CV_EXPORT_REPOSITORIES_SECTION_KEY,
  CV_EXPORT_SECTION_OPTIONS,
} from "../constants/cv-export.constants";
import type { CvExportSectionsProps } from "../types/cv-export-sections-props.types";
import { countActiveCvSections } from "../utils/count-active-cv-sections";
import { formatRepositoryCount } from "../utils/format-repository-count";

export function CvExportSections({ sections, repositoryCount, isDisabled, onToggle }: CvExportSectionsProps) {
  const activeCount = countActiveCvSections(sections);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <p id="cv-export-sections-title" className="text-sm font-semibold text-ink">
          Selecciona las secciones a incluir en el documento:
        </p>
        <Badge variant="outline" className="rounded-full font-semibold text-ink">
          {activeCount} de {CV_EXPORT_SECTION_OPTIONS.length} activas
        </Badge>
      </div>
      <ul aria-labelledby="cv-export-sections-title" className="flex flex-col gap-2.5">
        {CV_EXPORT_SECTION_OPTIONS.map(({ key, label }) => {
          const labelId = `cv-export-section-${key}`;
          const hasRepositories = key === CV_EXPORT_REPOSITORIES_SECTION_KEY && repositoryCount > 0;

          return (
            <li key={key}>
              <Label className="cursor-pointer gap-3 rounded-lg border border-border px-4 py-3 text-sm leading-normal font-medium text-ink hover:bg-surface-soft">
                <Checkbox
                  aria-labelledby={labelId}
                  checked={sections[key]}
                  disabled={isDisabled}
                  onCheckedChange={() => onToggle(key)}
                />
                <span id={labelId} className="min-w-0 [overflow-wrap:anywhere]">
                  {label}
                </span>
                {hasRepositories ? (
                  <Badge variant="outline" className="bg-surface-soft text-ink-soft">
                    {formatRepositoryCount(repositoryCount)}
                  </Badge>
                ) : null}
              </Label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
