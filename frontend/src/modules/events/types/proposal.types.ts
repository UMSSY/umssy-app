export type ProposalModality = 'presencial' | 'virtual';

export interface ProposalValues {
  title: string;
  description: string;
  categoryId: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  capacity: string;
  modality: ProposalModality;
  location: string;
}

export interface ProposalCover {
  file: File;
  previewUrl: string;
}

export type ProposalErrors = Partial<Record<keyof ProposalValues | 'cover', string>>;

export interface CreatedProposal {
  id: string;
  status: 'voting';
  supportThreshold: number;
  votingDeadline: string;
  coverUrl: string;
}
