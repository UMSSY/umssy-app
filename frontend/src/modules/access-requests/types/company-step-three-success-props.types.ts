export interface CompanyStepThreeSuccessProps {
  companyName: string;
  requestCode: string;
  copiedCode: boolean;
  onCopyCode: (code: string) => void;
}
