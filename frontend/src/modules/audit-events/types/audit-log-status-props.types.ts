export interface AuditLogStatusProps {
  error: string | null;
  errorStatus: number | null;
  isEmpty: boolean;
  hasActiveFilters?: boolean;
  onRetry: () => void;
  onClearFilters?: () => void;
}
