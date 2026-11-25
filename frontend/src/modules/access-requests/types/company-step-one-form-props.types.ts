import type { ChangeEvent, DragEvent, FormEvent, RefObject } from 'react';
import type { CityItem, CreateCompanyRequestPayload } from './company-access-request.types';
import type { CompanyLogoDimensions } from './company-logo-dimensions.types';

export interface CompanyStepOneFormProps {
  form: CreateCompanyRequestPayload;
  cities: CityItem[];
  submitting: boolean;
  logoInputRef: RefObject<HTMLInputElement | null>;
  logoFile: File | null;
  logoPreview: string | null;
  logoDimensions: CompanyLogoDimensions | null;
  isLogoDragging: boolean;
  onFormChange: (next: CreateCompanyRequestPayload) => void;
  onLogoChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onLogoDrop: (e: DragEvent<HTMLDivElement>) => void;
  onSetLogoDragging: (dragging: boolean) => void;
  onOpenLogoModal: () => void;
  onRemoveLogo: () => void;
  onSubmit: (e: FormEvent) => void;
}
