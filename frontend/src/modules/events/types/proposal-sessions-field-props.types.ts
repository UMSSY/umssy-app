import type { ProposalSession } from './proposal-session.types';
import type { ProposalSessionErrors } from './proposal-session-errors.types';

export interface ProposalSessionsFieldProps {
  sessions: ProposalSession[];
  errors: ProposalSessionErrors;
  error?: string;
  minDate: string;
  maxDate: string;
  canAdd: boolean;
  disabled: boolean;
  onAdd: () => void;
  onChange: (index: number, key: keyof ProposalSession, value: string) => void;
  onRemove: (index: number) => void;
}
