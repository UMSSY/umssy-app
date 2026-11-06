import type { ProposalCover, ProposalValues } from './proposal.types';

export interface ProposalReviewDialogProps {
  open: boolean; values: ProposalValues; cover: ProposalCover | null; tutor: string; category: string;
  pending: boolean; unavailable: boolean; error: string | null; onClose: () => void; onConfirm: () => void;
}
