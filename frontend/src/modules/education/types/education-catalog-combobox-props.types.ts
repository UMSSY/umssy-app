export interface EducationCatalogComboboxProps {
  id: string;
  value: string;
  options: readonly { name: string; aliases?: readonly string[] }[];
  texts: { placeholder: string; listLabel: string; noMatches: string };
  name: string;
  autoFocus?: boolean;
  error?: string;
  disabled?: boolean;
  describedBy?: string;
  onChange: (value: string) => void;
}
