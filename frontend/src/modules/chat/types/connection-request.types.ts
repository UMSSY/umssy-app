
export type ConnectionRequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED";
export interface ConnectionRequestSender {
  id: string;
  firstName: string;
  lastName: string;
  headline: string | null;
  isActive: boolean;
}
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
  sender?: ConnectionRequestSender;
}
export interface SendConnectionRequestPayload {
  receiverId: string;
}
