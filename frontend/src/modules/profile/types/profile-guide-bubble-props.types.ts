import type { ReactNode } from 'react';

export interface ProfileGuideBubbleProps {
  isOpen: boolean;
  popKey?: string | number;
  children: ReactNode;
  className?: string;
}
