import type { ApplicationSortKey } from "./application-sort-key.types";
import type { SortDirection } from "./sort-direction.types";

export interface ApplicationSort {
  key: ApplicationSortKey;
  direction: SortDirection;
}
