import type { ReactNode } from 'react';

export interface RadarCardProps {
  as?: 'section' | 'aside' | 'li';
  className?: string;
  children: ReactNode;
  'aria-labelledby'?: string;
}
