export interface FindEventsPayload {
  categoryId?: string;
  statusId?: string;
  isPublishedOnly?: boolean;
  search?: string;
  userId?: string;
  skip: number;
  take: number;
}