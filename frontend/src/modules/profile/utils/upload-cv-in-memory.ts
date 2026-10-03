import type { SavedCv } from "../types/saved-cv.types";
import { createSavedCv } from "./create-saved-cv";

export function uploadCvInMemory(file: File): Promise<SavedCv> {
  return Promise.resolve(createSavedCv(file, new Date()));
}
