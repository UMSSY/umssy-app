import type { CvPage } from "../types/cv-page.types";
import type { CvPageResponse } from "../types/cv-page-response.types";
import { toSavedCv } from "./to-saved-cv";

export function toCvPage(response: CvPageResponse | null | undefined): CvPage {
  return {
    items: (response?.items ?? []).map(toSavedCv),
    totalItems: response?.totalItems ?? 0,
    totalPages: response?.totalPages ?? 0,
    page: response?.page ?? 1,
  };
}
