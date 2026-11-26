import type { ReactNode } from "react";

export interface ProfilePageLayoutProps {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}
