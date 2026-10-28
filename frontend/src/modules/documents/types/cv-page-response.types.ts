import type { CvResponse } from "./cv-response.types";

export interface CvPageResponse {
  items?: CvResponse[] | null;
  totalItems: number;
  totalPages: number;
  page: number;
  limit: number;
}
