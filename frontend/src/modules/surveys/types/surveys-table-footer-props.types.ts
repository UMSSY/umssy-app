export interface SurveysTableFooterProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}
