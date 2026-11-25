import type { FormEvent } from 'react';
import type { CompanyOfficialData } from './company-access-request.types';
import type { CompanyActivationState } from './company-activation-state.types';

export interface CompanyActivationStatusCardsProps {
  state: CompanyActivationState;
  serverMessage: string;
  officialData: CompanyOfficialData | null;
  trackingCode: string;
  codeError: string | null;
  isVerifyingCode: boolean;
  onTrackingCodeChange: (code: string) => void;
  onVerifyCode: (e: FormEvent) => void;
  onGoToLogin: () => void;
}
