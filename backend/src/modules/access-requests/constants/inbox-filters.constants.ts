export const INBOX_PERIODS = ['7d', '30d', 'all'] as const;

export const INBOX_PERIOD_DAYS: Record<string, number | undefined> = {
  '7d': 7,
  '30d': 30,
};
