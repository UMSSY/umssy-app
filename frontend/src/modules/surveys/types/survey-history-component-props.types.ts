import type { SurveyHistoryItem, SurveyHistoryStatus } from "./survey-history.types";

export interface SurveyHistoryTableProps {
  surveys: SurveyHistoryItem[];
  isLoading: boolean;
  errorMessage?: string;
  searchTerm?: string;
  onViewDetails: (survey: SurveyHistoryItem) => void;
}

export interface SurveyHistoryTableFooterProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  isLoading: boolean;
  itemLabel: string;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

export interface SurveyHistoryDetailDialogProps {
  survey: SurveyHistoryItem | null;
  onOpenChange: (open: boolean) => void;
}

export interface SurveyCreatorCellProps {
  fullName: string;
  email: string;
}

export interface SurveyHistoryStatusBadgeProps {
  status: SurveyHistoryStatus;
}
