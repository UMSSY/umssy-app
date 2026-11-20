export interface AppointmentsPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  isDisabled: boolean;
  onPageChange: (page: number) => void;
}
