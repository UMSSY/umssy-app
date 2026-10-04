export interface ComparisonField {
  id: string;
  label: string;
  declaredValue: string;
  documentValue: string;
}

export interface DataComparisonProps {
  fields: ComparisonField[];
  isEditable?: boolean;
  onDocumentValueChange?: (fieldId: string, value: string) => void;
}