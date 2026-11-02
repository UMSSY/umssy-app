export interface ProfileSkillProcessingState {
  userId: string;
  status: string;
  inputRevision: number;
  processedRevision: number | null;
  resultVersion: number;
  updatedAt: Date;
  dictionaryVersion: string | null;
}
