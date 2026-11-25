import type { RefObject } from 'react';
import type { CompanyLogoDimensions } from './company-logo-dimensions.types';

export interface CompanyLogoPreviewDialogProps {
  open: boolean;
  logoFile: File | null;
  logoPreview: string | null;
  logoDimensions: CompanyLogoDimensions | null;
  previewBg: 'light' | 'dark';
  logoInputRef: RefObject<HTMLInputElement | null>;
  onChangeBg: (bg: 'light' | 'dark') => void;
  onClose: () => void;
  onRemoveLogo: () => void;
}
