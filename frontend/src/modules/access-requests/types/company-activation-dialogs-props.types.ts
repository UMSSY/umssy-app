import type { CompanyOfficialData } from './company-access-request.types';
import type { CompanyReportStatus } from './company-report-status.types';

export interface CompanyActivationDialogsProps {
  officialData: CompanyOfficialData | null;
  isReportOpen: boolean;
  reportObservation: string;
  reportStatus: CompanyReportStatus;
  reportMessage: string;
  isConfirmModalOpen: boolean;
  isActivating: boolean;
  onReportOpenChange: (open: boolean) => void;
  onReportObservationChange: (value: string) => void;
  onSendReport: () => void;
  onConfirmOpenChange: (open: boolean) => void;
  onConfirmActivation: () => void;
}
