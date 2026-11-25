import type { CompanyOfficialData } from './company-access-request.types';

export interface CompanyActivationReadyPanelProps {
  officialData: CompanyOfficialData;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  passwordsMatch: boolean;
  canFinalize: boolean;
  activationError: string | null;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onToggleShowPassword: () => void;
  onToggleShowConfirmPassword: () => void;
  onOpenReport: () => void;
  onOpenConfirm: () => void;
}
