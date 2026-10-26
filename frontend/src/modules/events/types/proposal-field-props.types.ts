import type { ReactNode } from 'react';

export interface ProposalFieldProps {
  id: string; label: string; error?: string; required?: boolean; children: ReactNode;
}
