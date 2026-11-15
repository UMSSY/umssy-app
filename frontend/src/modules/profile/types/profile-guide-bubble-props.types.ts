import type { ReactNode } from 'react';

export interface ProfileGuideBubbleProps {
  isOpen: boolean;
  /** Plays a pop when it changes while the bubble is open. */
  popKey?: string | number;
  children: ReactNode;
  className?: string;
}
