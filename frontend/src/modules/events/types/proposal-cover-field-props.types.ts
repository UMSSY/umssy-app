import type { ProposalCover } from './proposal.types';

export interface ProposalCoverFieldProps {
  value: ProposalCover | null; onChange: (value: ProposalCover | null) => void;
  error?: string; disabled?: boolean; onBusyChange: (busy: boolean) => void;
}
