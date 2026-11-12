"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CV_EMPTY_EXTRACTION_SELECTION } from "../constants/cv-extraction.constants";
import { CV_ERROR_MESSAGES } from "../constants/cv-error-messages.constants";
import { documentsService } from "../services/documents.service";
import type { CvApplyResult } from "../types/cv-apply-result.types";
import type { CvExtractedContact } from "../types/cv-extracted-contact.types";
import type { CvExtractedEducation } from "../types/cv-extracted-education.types";
import type { CvExtractedPresentation } from "../types/cv-extracted-presentation.types";
import type { CvExtractedWorkExperience } from "../types/cv-extracted-work-experience.types";
import type { CvExtraction } from "../types/cv-extraction.types";
import type { CvExtractionSection } from "../types/cv-extraction-section.types";
import type { CvExtractionSelection } from "../types/cv-extraction-selection.types";
import type { UseCvExtractionOptions } from "../types/use-cv-extraction-options.types";
import { buildDefaultCvSelection } from "../utils/build-default-cv-selection";
import { getCvErrorMessage } from "../utils/get-cv-error-message";
import { removeAppliedCvSelection } from "../utils/remove-applied-cv-selection";
import { toggleCvSection } from "../utils/toggle-cv-section";
import { toggleCvSelectionItem } from "../utils/toggle-cv-selection-item";
import { updateListItem } from "../utils/update-list-item";

export function useCvExtraction({ currentHeadline = null }: UseCvExtractionOptions = {}) {
  const [extraction, setExtraction] = useState<CvExtraction | null>(null);
  const [available, setAvailable] = useState<CvExtractionSelection>(CV_EMPTY_EXTRACTION_SELECTION);
  const [selection, setSelection] = useState<CvExtractionSelection>(CV_EMPTY_EXTRACTION_SELECTION);
  const mutation = useMutation({
    mutationFn: (cvId: string) => documentsService.extractCvData(cvId),
    onSuccess: (result) => {
      const defaults = buildDefaultCvSelection(result);
      const headline = (currentHeadline ?? "").trim();
      setExtraction({ ...result, presentation: { ...result.presentation, headline: headline || null } });
      setAvailable(defaults);
      setSelection(defaults);
    },
  });

  const updateExtraction = (update: (current: CvExtraction) => CvExtraction) =>
    setExtraction((current) => (current ? update(current) : current));

  const close = () => {
    mutation.reset();
    setExtraction(null);
    setAvailable(CV_EMPTY_EXTRACTION_SELECTION);
    setSelection(CV_EMPTY_EXTRACTION_SELECTION);
  };

  return {
    extraction,
    available,
    selection,
    isExtracting: mutation.isPending,
    isOpen: mutation.isPending || mutation.isError || extraction !== null,
    errorMessage: mutation.error ? getCvErrorMessage(mutation.error, CV_ERROR_MESSAGES.extract) : null,
    startExtraction: (cvId: string) => {
      close();
      mutation.mutate(cvId);
    },
    toggleItem: <K extends CvExtractionSection>(section: K, item: CvExtractionSelection[K][number]) =>
      setSelection((current) => toggleCvSelectionItem(current, section, item)),
    toggleSection: (section: CvExtractionSection) =>
      setSelection((current) => toggleCvSection(current, available, section)),
    updateContact: (changes: Partial<CvExtractedContact>) =>
      updateExtraction((current) => ({ ...current, contact: { ...current.contact, ...changes } })),
    updatePresentation: (changes: Partial<CvExtractedPresentation>) =>
      updateExtraction((current) => ({ ...current, presentation: { ...current.presentation, ...changes } })),
    updateEducation: (index: number, changes: Partial<CvExtractedEducation>) =>
      updateExtraction((current) => ({ ...current, educations: updateListItem(current.educations, index, changes) })),
    updateWorkExperience: (index: number, changes: Partial<CvExtractedWorkExperience>) =>
      updateExtraction((current) => ({
        ...current,
        workExperiences: updateListItem(current.workExperiences, index, changes),
      })),
    removeApplied: (results: readonly CvApplyResult[]) =>
      setSelection((current) => removeAppliedCvSelection(current, results)),
    close,
  };
}
