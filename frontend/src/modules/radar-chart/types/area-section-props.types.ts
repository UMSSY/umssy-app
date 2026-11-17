import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface AreaSectionProps {
  title: string;
  icon: LucideIcon;
  count: number;
  children: ReactNode;
}
