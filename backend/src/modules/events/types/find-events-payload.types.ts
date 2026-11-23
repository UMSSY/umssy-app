export interface FindEventsPayload {
  includeProposals?: boolean;
  categoryId?: string;
  statusId?: string;
  search?: string;
  userId?: string;
  skip?: number;
  take?: number;
}
