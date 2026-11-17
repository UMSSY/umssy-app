export interface ReactivateApplicationButtonProps {
  applicationId: string;
  reactivatingId?: string | null;
  onReactivate: (applicationId: string) => void;
  className?: string;
}
