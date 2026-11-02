import type { ReactNode } from "react";

export interface AppRouteLayoutProps {
  children: ReactNode;
  fallbacks?: Readonly<Record<string, ReactNode>>;
}
