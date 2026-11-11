export interface CvExtractionOptionProps {
  title: string;
  details?: string[];
  isChecked: boolean;
  isIncomplete?: boolean;
  onToggle: () => void;
}
