import type { MentorSort } from "./mentor-directory.types";

export interface MentorDirectoryParams {
  page: number;
  search: string;
  area: string;
  areaIds?: string[];
  orientation?: string;
  available: boolean;
  sort: MentorSort;
}
