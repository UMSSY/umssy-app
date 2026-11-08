import type { MentorSort } from "./mentor-directory.types";

export interface MentorDirectoryParams {
  page: number;
  search: string;
  area: string;
  orientation?: string;
  available: boolean;
  sort: MentorSort;
}
