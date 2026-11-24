import type { Dispatch, SetStateAction } from "react";

export type MentorProfileDraftValue = {
  technicalAreaIds: string[] | null;
  orientationTypeIds: string[] | null;
  setTechnicalAreaIds: Dispatch<SetStateAction<string[] | null>>;
  setOrientationTypeIds: Dispatch<SetStateAction<string[] | null>>;
  clearTechnicalAreaIds: () => void;
  clearOrientationTypeIds: () => void;
  clearAllDrafts: () => void;
};