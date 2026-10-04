import type { EventCategoryItem } from './event.types';

export interface CategoryFilterChipsProps {
  categories: EventCategoryItem[];
  selectedId: string | null;
  onSelect: (categoryId: string | null) => void;
}