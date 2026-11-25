export interface CompanyFlowErrorModalState {
  open: boolean;
  title: string;
  category: 'conflict' | 'validation' | 'server' | 'network';
  message: string;
  field?: 'email' | 'companyName' | 'activeRequest';
  recommendation: string;
}
