import type { ReactNode } from "react";

export interface SectionCardProps {
  title: ReactNode;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}