export interface SupportTransactionResult {
  created: boolean;
  supportCount: number;
  supportThreshold: number | null;
  published: boolean;
}