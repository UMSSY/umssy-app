import type { FormEvent } from 'react';

export interface CompanyStepTwoFormProps {
  documentFile: File | null;
  documentPreviewUrl: string | null;
  documentError: string | null;
  submitting: boolean;
  onFileSelected: (file: File) => void;
  onRemoveDocument: () => void;
  onBack: () => void;
  onSubmit: (e: FormEvent) => void;
}
