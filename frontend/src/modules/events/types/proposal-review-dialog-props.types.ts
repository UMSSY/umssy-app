import type { ProposalCover, ProposalValues } from './proposal.types';
import type { ProposalSession } from './proposal-session.types';

export interface ProposalReviewDialogProps {
  open: boolean; values: ProposalValues; sessions?: ProposalSession[]; cover: ProposalCover | null; tutor: string; category: string;
  pending: boolean; unavailable: boolean; error: string | null; onClose: () => void; onConfirm: () => void;
}
