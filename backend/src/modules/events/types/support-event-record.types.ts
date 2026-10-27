export interface SupportEventRecord {
  id: string;
  status: { title: string };
  origin: { title: string };
  votingDeadline: Date | null;
  supportThreshold: number | null;
  _count: { registrations: number };
}
