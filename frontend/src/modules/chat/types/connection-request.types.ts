
export type ConnectionRequestStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED';

export interface ConnectionRequest {
  id: string;
  senderId: string;
  receiverId: string;
  statusId: string;
  createdAt: string;
  updatedAt: string;
  status?: {
    id: string;
    title: ConnectionRequestStatus;
  };
}

export interface SendConnectionRequestPayload {
  receiverId: string;
}
