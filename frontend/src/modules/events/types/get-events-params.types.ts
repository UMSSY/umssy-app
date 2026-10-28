export interface GetEventsParams {
  includeProposals?: boolean;
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
}
