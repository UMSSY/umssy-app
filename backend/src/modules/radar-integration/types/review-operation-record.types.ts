export type ReviewOperationRecord = {
  id: string;
  admin_id: string;
  flow: string;
  kind: string;
  target_id: string;
  payload_hash: string;
  response_data: unknown;
  created_at: Date;
};
