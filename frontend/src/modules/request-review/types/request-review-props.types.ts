import type { AccessRequestSummaryResponse, RequestStatus } from "./request-review.types";

export interface RequestsPaginationProps {
  /** Página actual, empezando en 1 */
  page: number;
  /** Cantidad de solicitudes por página */
  limit: number;
  /** Total de solicitudes del estado seleccionado */
  total: number;
  isDisabled?: boolean;
  onPageChange: (page: number) => void;
}

export interface RequestsTableSkeletonProps {
  rowCount?: number;
}

export interface RequestsEmptyStateProps {
  /** Nombre del estado activo, por ejemplo "Pendientes" */
  statusLabel: string;
}

export interface RequestsStatusTabsProps {
  activeStatus: RequestStatus;
  onStatusChange: (status: RequestStatus) => void;
}

export interface RequestsTableProps {
  requests: AccessRequestSummaryResponse[];
  onReview: (requestId: string) => void;
}