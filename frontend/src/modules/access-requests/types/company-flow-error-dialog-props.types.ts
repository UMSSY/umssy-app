import type { CompanyFlowErrorModalState } from './company-flow-error-modal.types';

export interface CompanyFlowErrorDialogProps {
  errorModal: CompanyFlowErrorModalState;
  onOpenChange: (open: boolean) => void;
}
