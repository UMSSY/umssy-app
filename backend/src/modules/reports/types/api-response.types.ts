export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  page?: number;
  detail: string;
  ok: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  totalItems: number;
  page: number;
  limit: number;
}
