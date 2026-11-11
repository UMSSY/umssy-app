"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CV_EMPTY_EXTRACTION_SELECTION } from "../constants/cv-extraction.constants";
import { CV_ERROR_MESSAGES } from "../constants/cv-error-messages.constants";
import { documentsService } from "../services/documents.service";
import type { CvContactField } from "../types/cv-contact-field.types";
import type { CvExtraction } from "../types/cv-extraction.types";
import type { CvExtractionSelection } from "../types/cv-extraction-selection.types";
import type { CvProfileDraft } from "../types/cv-profile-draft.types";
import { buildCvProfileDraft } from "../utils/build-cv-profile-draft";
import { buildDefaultCvSelection } from "../utils/build-default-cv-selection";
import { getCvErrorMessage } from "../utils/get-cv-error-message";
import { toggleListItem } from "../utils/toggle-list-item";

export function useCvExtraction() {
  const [extraction, setExtraction] = useState<CvExtraction | null>(null);
  const [selection, setSelection] = useState<CvExtractionSelection>(CV_EMPTY_EXTRACTION_SELECTION);
  const mutation = useMutation({
    mutationFn: (cvId: string) => documentsService.extractCvData(cvId),
    onSuccess: (result) => {
      setExtraction(result);
      setSelection(buildDefaultCvSelection(result));
    },
  });

  const close = () => {
    mutation.reset();
    setExtraction(null);
    setSelection(CV_EMPTY_EXTRACTION_SELECTION);
  };

  return {
    extraction,
    selection,
    isExtracting: mutation.isPending,
    isOpen: mutation.isPending || mutation.isError || extraction !== null,
    errorMessage: mutation.error ? getCvErrorMessage(mutation.error, CV_ERROR_MESSAGES.extract) : null,
    startExtraction: (cvId: string) => {
      close();
      mutation.mutate(cvId);
    },
    toggleContactField: (field: CvContactField) =>
      setSelection((current) => ({ ...current, contactFields: toggleListItem(current.contactFields, field) })),
    toggleEducation: (index: number) =>
      setSelection((current) => ({ ...current, educations: toggleListItem(current.educations, index) })),
    toggleWorkExperience: (index: number) =>
      setSelection((current) => ({ ...current, workExperiences: toggleListItem(current.workExperiences, index) })),
    buildDraft: (): CvProfileDraft | null => (extraction ? buildCvProfileDraft(extraction, selection) : null),
    close,
  };
}
