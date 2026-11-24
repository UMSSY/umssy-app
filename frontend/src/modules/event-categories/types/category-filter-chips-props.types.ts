export interface CategoryFilterChipsProps {
  categories: Array<{ id: string; name: string }>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  isAllActive?: boolean;
}