"use client";

import { LoaderCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CV_EXTRACTION_FALLBACK_TEXTS,
  CV_EXTRACTION_SECTION_LABELS,
  CV_EXTRACTION_SECTIONS,
  CV_PRESENTATION_INDEX,
  CV_REVIEW_TEXTS,
} from "../constants/cv-extraction.constants";
import { CV_APPLY_TEXTS } from "../constants/cv-apply.constants";
import type { CvExtractionDialogProps } from "../types/cv-extraction-dialog-props.types";
import { countCvSelection } from "../utils/count-cv-selection";
import { isCvHeadlineMissing } from "../utils/is-cv-headline-missing";
import { isCvSectionFullySelected } from "../utils/is-cv-section-fully-selected";
import { CvContactReview } from "./cv-contact-review";
import { CvEducationReview } from "./cv-education-review";
import { CvExtractionFallback } from "./cv-extraction-fallback";
import { CvPresentationReview } from "./cv-presentation-review";
import { CvReviewSection } from "./cv-review-section";
import { CvSkillsReview } from "./cv-skills-review";
import { CvWorkExperienceReview } from "./cv-work-experience-review";

export function CvExtractionDialog({
  isOpen,
  isExtracting,
  extraction,
  available,
  selection,
  errorMessage = null,
  canRetry = false,
  isApplying = false,
  applyReport = null,
  onToggleItem,
  onToggleSection,
  onContactChange,
  onPresentationChange,
  onEducationChange,
  onWorkExperienceChange,
  onRetry,
  onApply,
  onClose,
}: CvExtractionDialogProps) {
  const isHeadlineMissing = isCvHeadlineMissing(extraction, selection);
  const isBusy = isExtracting || isApplying;
  const canApply = !isBusy && extraction !== null && countCvSelection(selection) > 0 && !isHeadlineMissing;
  const isEmpty = extraction !== null && countCvSelection(available) === 0;
  const failed = applyReport?.failed ?? [];
  const applied = applyReport?.applied ?? [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open || isBusy ? undefined : onClose())}>
      <DialogContent className="max-w-3xl gap-0 rounded-lg border border-border bg-surface p-0 text-ink ring-0 sm:max-w-3xl">
        <DialogHeader className="gap-1.5 border-b border-border px-6 py-5 pr-14">
          <DialogTitle className="font-tight text-xl font-bold text-ink">{CV_REVIEW_TEXTS.title}</DialogTitle>
          <DialogDescription className="text-sm text-text-secondary">{CV_REVIEW_TEXTS.description}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
          {isExtracting ? (
            <div aria-busy="true" className="flex flex-col gap-3">
              <p className="flex items-center gap-2 text-sm text-text-secondary">
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                {CV_REVIEW_TEXTS.loading}
              </p>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : null}
          {!isExtracting && errorMessage ? (
            <CvExtractionFallback
              title={CV_EXTRACTION_FALLBACK_TEXTS.errorTitle}
              message={errorMessage}
              canRetry={canRetry}
              onRetry={onRetry}
              onManualFill={onClose}
            />
          ) : null}
          {!isExtracting && !errorMessage && isEmpty ? (
            <CvExtractionFallback
              title={CV_EXTRACTION_FALLBACK_TEXTS.emptyTitle}
              message={CV_EXTRACTION_FALLBACK_TEXTS.emptyMessage}
              onManualFill={onClose}
            />
          ) : null}
          {failed.length > 0 ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>{CV_APPLY_TEXTS.partialTitle}</AlertTitle>
              <AlertDescription className="flex flex-col gap-1">
                {applied.length > 0 ? <p>{`${CV_APPLY_TEXTS.appliedLabel} ${applied.join(", ")}.`}</p> : null}
                <p>{`${CV_APPLY_TEXTS.failedLabel} ${failed.join(", ")}.`}</p>
                <p>{CV_APPLY_TEXTS.retryHint}</p>
              </AlertDescription>
            </Alert>
          ) : null}
          {!isExtracting && !errorMessage && extraction && !isEmpty ? (
            <Tabs defaultValue={CV_EXTRACTION_SECTIONS[0]}>
              <TabsList aria-label="Secciones del CV" className="h-auto flex-wrap">
                {CV_EXTRACTION_SECTIONS.map((section) => (
                  <TabsTrigger key={section} value={section}>
                    {`${CV_EXTRACTION_SECTION_LABELS[section]} (${(available[section] ?? []).length})`}
                  </TabsTrigger>
                ))}
              </TabsList>
              {CV_EXTRACTION_SECTIONS.map((section) => (
                <TabsContent key={section} value={section} className="pt-4">
                  <CvReviewSection
                    section={section}
                    selectedCount={(selection[section] ?? []).length}
                    availableCount={(available[section] ?? []).length}
                    isFullySelected={isCvSectionFullySelected<string | number>(selection[section], available[section])}
                    onToggleSection={() => onToggleSection(section)}
                  >
                    {section === "contact" ? (
                      <CvContactReview
                        contact={extraction.contact}
                        fields={available.contact}
                        selected={selection.contact}
                        onToggle={(field) => onToggleItem("contact", field)}
                        onChange={onContactChange}
                      />
                    ) : null}
                    {section === "presentation" && selection.presentation.includes(CV_PRESENTATION_INDEX) ? (
                      <CvPresentationReview
                        presentation={extraction.presentation}
                        isHeadlineMissing={isHeadlineMissing}
                        onChange={onPresentationChange}
                      />
                    ) : null}
                    {section === "education" ? (
                      <CvEducationReview
                        educations={extraction.educations}
                        selected={selection.education}
                        onToggle={(index) => onToggleItem("education", index)}
                        onChange={onEducationChange}
                      />
                    ) : null}
                    {section === "experience" ? (
                      <CvWorkExperienceReview
                        workExperiences={extraction.workExperiences}
                        selected={selection.experience}
                        onToggle={(index) => onToggleItem("experience", index)}
                        onChange={onWorkExperienceChange}
                      />
                    ) : null}
                    {section === "skills" ? (
                      <CvSkillsReview
                        skills={extraction.skills}
                        selected={selection.skills}
                        onToggle={(index) => onToggleItem("skills", index)}
                      />
                    ) : null}
                  </CvReviewSection>
                </TabsContent>
              ))}
            </Tabs>
          ) : null}
        </div>
        <DialogFooter className="mx-0 mb-0 flex-row justify-end gap-3 border-t border-border bg-transparent px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="h-10 border-border-strong px-4 text-sm text-ink hover:bg-surface-soft"
            disabled={isBusy}
            onClick={onClose}
          >
            {CV_REVIEW_TEXTS.cancel}
          </Button>
          <Button
            type="button"
            className="h-10 bg-primary px-4 text-sm text-primary-foreground hover:bg-brand-hover"
            disabled={!canApply}
            onClick={onApply}
          >
            {isApplying ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
            {isApplying ? CV_APPLY_TEXTS.applying : CV_REVIEW_TEXTS.apply}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
