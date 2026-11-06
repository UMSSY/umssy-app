import type { FilterOption } from "./filter-option.types";

export interface FilterColumnProps<T extends string> {
  title: string;
  options: Array<FilterOption<T>>;
  selected: T;
  onSelect: (value: T) => void;
}
