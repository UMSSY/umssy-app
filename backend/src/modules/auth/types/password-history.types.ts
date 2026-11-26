export interface PasswordHistorySnapshot {
  password: string | null;
  passwordHistories: Array<{ passwordHash: string }>;
}

