export interface AppointmentDocumentFieldProps {
  file: File | null;
  error?: string;
  disabled: boolean;
  onSelect: (file: File) => void;
  onRemove: () => void;
}
