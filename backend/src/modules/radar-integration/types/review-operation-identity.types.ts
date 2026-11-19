export interface ReviewOperationIdentity {
  adminId: string;
  operationId: string;
  flow: string;
  kind?: string;
  targetId?: string;
  payloadHash?: string;
}
