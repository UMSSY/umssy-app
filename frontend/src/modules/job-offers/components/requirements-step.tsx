"use client";

import { Info } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { DetectedSkillsChips } from "@/modules/profile";
import {
  FIELD_FOCUS_CLASS,
  MAX_DESCRIPTION_CHARS,
  MAX_SKILLS,
  REQUIREMENTS_SKILLS_TEXT,
  SKILLS_CATALOG_MESSAGES,
  VACANCY_MESSAGES,
} from "../constants/job-offers.constants";
import { useRequirementsSkillsPreview } from "../hooks/use-requirements-skills-preview";
import { useSkillsCatalog } from "../hooks/use-skills-catalog";
import type { SkillOption } from "../types/skill-option.types";
import { FieldError } from "./field-error";
import { SelectedSkillChip } from "./selected-skill-chip";
import { SkillSearchDialog } from "./skill-search-dialog";
import { StepActions } from "./step-actions";
import type { RequirementsStepProps } from "../types/requirements-step-props.types";

export function RequirementsStep({
  conditions,
  errors,
  updateField,
  onPrevious,
  onContinue,
}: RequirementsStepProps) {
  const catalog = useSkillsCatalog();
  const { detectedSkills, processingTimeMs, isAnalyzing, isError } = useRequirementsSkillsPreview(
    conditions.description,
  );
  const hasTypedRef = useRef(false);
  const dismissedSkillIdsRef = useRef(new Set<string>());
  const isSkillLimitReached = conditions.skills.length >= MAX_SKILLS;

  useEffect(() => {
    if (!hasTypedRef.current) return;
    const room = MAX_SKILLS - conditions.skills.length;
    if (room <= 0) return;
    const additions = detectedSkills
      .filter(
        (skill) =>
          !dismissedSkillIdsRef.current.has(skill.id) && !conditions.skills.some((item) => item.id === skill.id),
      )
      .slice(0, room);
    if (additions.length === 0) return;
    updateField("skills", [...conditions.skills, ...additions]);
  }, [detectedSkills, conditions.skills, updateField]);

  const handleDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    hasTypedRef.current = true;
    updateField("description", event.target.value.slice(0, MAX_DESCRIPTION_CHARS));
  };

  const isSelected = (skill: SkillOption) => conditions.skills.some((item) => item.id === skill.id);

  const removeSkill = (skill: SkillOption) => {
    dismissedSkillIdsRef.current.add(skill.id);
    updateField("skills", conditions.skills.filter((item) => item.id !== skill.id));
  };

  const addSkill = (skill: SkillOption) => {
    if (isSelected(skill) || isSkillLimitReached) return;
    dismissedSkillIdsRef.current.delete(skill.id);
    updateField("skills", [...conditions.skills, skill]);
  };

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <h2 className="text-base font-bold text-ink">Requisitos técnicos</h2>
      </div>

      <div className="p-6">
        <div className="mb-8">
          <Label htmlFor="description" className="mb-2 text-xs font-semibold text-ink">
            Descripción del puesto <span className="text-ink-soft">*</span>
          </Label>
          <Textarea
            id="description"
            value={conditions.description}
            onChange={handleDescriptionChange}
            maxLength={MAX_DESCRIPTION_CHARS}
            placeholder="Buscamos un desarrollador backend..."
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? "description-error" : undefined}
            className={cn("min-h-30 bg-surface p-4 text-sm whitespace-pre-wrap text-ink", FIELD_FOCUS_CLASS)}
          />
          <div className="mt-1 flex justify-end">
            <span
              className={cn(
                "text-xs font-medium",
                conditions.description.length >= MAX_DESCRIPTION_CHARS ? "text-danger" : "text-text-secondary",
              )}
            >
              {conditions.description.length}/{MAX_DESCRIPTION_CHARS}
            </span>
          </div>
          <FieldError fieldId="description" message={errors.description} />
          <DetectedSkillsChips skills={detectedSkills} processingTimeMs={processingTimeMs} isLoading={isAnalyzing} />
          {isError && <p className="mt-3 text-xs text-text-secondary">{REQUIREMENTS_SKILLS_TEXT.detectionError}</p>}
        </div>

        <div id="skills" tabIndex={-1}>
          <h3 className="mb-2 text-base font-bold text-ink">{REQUIREMENTS_SKILLS_TEXT.allSkillsTitle}</h3>
          <div className="mb-4 flex items-center gap-2">
            <Info className="size-4 shrink-0 text-accent" aria-hidden="true" />
            <p className="text-sm text-text-secondary">
              {REQUIREMENTS_SKILLS_TEXT.skillsIntro} {REQUIREMENTS_SKILLS_TEXT.autoSelectHint}
            </p>
          </div>

          {catalog.status === "loading" && (
            <p className="text-sm text-text-secondary">{SKILLS_CATALOG_MESSAGES.loading}</p>
          )}

          {catalog.status === "error" && (
            <div role="alert" className="flex items-center gap-3 text-sm text-danger">
              <span>{SKILLS_CATALOG_MESSAGES.error}</span>
              <Button type="button" variant="outline" size="sm" onClick={catalog.reload}>
                {SKILLS_CATALOG_MESSAGES.retry}
              </Button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2.5">
            {conditions.skills.map((skill) => (
              <SelectedSkillChip key={skill.id} skill={skill} onRemove={removeSkill} />
            ))}
            {catalog.status === "ready" && (
              <SkillSearchDialog
                catalog={catalog.skills}
                selected={conditions.skills}
                isDisabled={isSkillLimitReached}
                onAdd={addSkill}
              />
            )}
          </div>

          {conditions.skills.length === 0 && catalog.status === "ready" && (
            <p className="mt-3 text-sm text-text-secondary">{REQUIREMENTS_SKILLS_TEXT.emptySelection}</p>
          )}

          {isSkillLimitReached && (
            <p className="mt-3 text-xs font-medium text-text-secondary">{VACANCY_MESSAGES.skillsLimit}</p>
          )}
          <FieldError fieldId="skills" message={errors.skills} />
        </div>
      </div>

      <StepActions
        secondaryLabel="Anterior"
        showPreviousIcon
        primaryLabel="Continuar"
        onSecondary={onPrevious}
        onPrimary={onContinue}
      />
    </div>
  );
}
