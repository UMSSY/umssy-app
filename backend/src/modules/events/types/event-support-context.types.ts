export interface EventSupportContext {
  id: string;
  statusTitle: string;
  originTitle: string;
  votingDeadline: Date | null;
  supportThreshold: number | null;
  supportCount: number;
}