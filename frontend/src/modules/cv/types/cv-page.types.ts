import type { SavedCv } from "./saved-cv.types";

export interface CvPage {
  items: SavedCv[];
  totalItems: number;
  totalPages: number;
  page: number;
}
