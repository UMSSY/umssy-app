export interface AuditPaginationProps {
  from: number;
  to: number;
  total: number;
  page: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onPageChange: (page: number) => void;
}
