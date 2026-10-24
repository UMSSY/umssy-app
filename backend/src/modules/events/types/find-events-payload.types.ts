export interface FindEventsPayload {
  includeProposals?: boolean;
  categoryId?: string;
  statusId?: string;
  isPublishedOnly?: boolean;
  search?: string;
  skip: number;
  take: number;
}
