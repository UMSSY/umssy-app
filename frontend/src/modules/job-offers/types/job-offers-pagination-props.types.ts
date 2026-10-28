export interface JobOffersPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
