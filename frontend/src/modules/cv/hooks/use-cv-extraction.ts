"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CV_CONTACT_FIELDS, CV_EMPTY_EXTRACTION_SELECTION } from "../constants/cv-extraction.constants";
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
import { getCvExtractionError } from "../utils/get-cv-extraction-error";
import { removeAppliedCvSelection } from "../utils/remove-applied-cv-selection";
import { selectCvSelectionItem } from "../utils/select-cv-selection-item";
import { toggleCvSection } from "../utils/toggle-cv-section";
import { toggleCvSelectionItem } from "../utils/toggle-cv-selection-item";
import { updateListItem } from "../utils/update-list-item";
import { useCvRecordMatcher } from "./use-cv-record-matcher";

export function useCvExtraction({ currentHeadline = null }: UseCvExtractionOptions = {}) {
  const [extraction, setExtraction] = useState<CvExtraction | null>(null);
  const [available, setAvailable] = useState<CvExtractionSelection>(CV_EMPTY_EXTRACTION_SELECTION);
  const [selection, setSelection] = useState<CvExtractionSelection>(CV_EMPTY_EXTRACTION_SELECTION);
  const matchRecords = useCvRecordMatcher();
  const mutation = useMutation({
    mutationFn: (cvId: string) => documentsService.extractCvData(cvId),
    onSuccess: (result) => {
      const headline = (currentHeadline ?? "").trim();
      setExtraction({ ...result, presentation: { ...result.presentation, headline: headline || null } });
      setAvailable(buildDefaultCvSelection(result));
      setSelection(buildDefaultCvSelection(result, matchRecords(result)));
    },
  });

  const error = mutation.error ? getCvExtractionError(mutation.error) : null;

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
    errorMessage: error?.message ?? null,
    isRetryable: error?.isRetryable ?? false,
    startExtraction: (cvId: string) => {
      close();
      mutation.mutate(cvId);
    },
    retry: () => {
      if (mutation.variables && error?.isRetryable) mutation.mutate(mutation.variables);
    },
    toggleItem: <K extends CvExtractionSection>(section: K, item: CvExtractionSelection[K][number]) =>
      setSelection((current) => toggleCvSelectionItem(current, section, item)),
    toggleSection: (section: CvExtractionSection) =>
      setSelection((current) => toggleCvSection(current, available, section)),
    updateContact: (changes: Partial<CvExtractedContact>) => {
      updateExtraction((current) => ({ ...current, contact: { ...current.contact, ...changes } }));
      setSelection((current) =>
        CV_CONTACT_FIELDS.filter((field) => field in changes).reduce(
          (selected, field) => selectCvSelectionItem(selected, "contact", field),
          current,
        ),
      );
    },
    updatePresentation: (changes: Partial<CvExtractedPresentation>) =>
      updateExtraction((current) => ({ ...current, presentation: { ...current.presentation, ...changes } })),
    updateEducation: (index: number, changes: Partial<CvExtractedEducation>) => {
      updateExtraction((current) => ({ ...current, educations: updateListItem(current.educations, index, changes) }));
      setSelection((current) => selectCvSelectionItem(current, "education", index));
    },
    updateWorkExperience: (index: number, changes: Partial<CvExtractedWorkExperience>) => {
      updateExtraction((current) => ({
        ...current,
        workExperiences: updateListItem(current.workExperiences, index, changes),
      }));
      setSelection((current) => selectCvSelectionItem(current, "experience", index));
    },
    removeApplied: (results: readonly CvApplyResult[]) =>
      setSelection((current) => removeAppliedCvSelection(current, results)),
    close,
  };
}
