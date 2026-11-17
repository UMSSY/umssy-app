import type { MouseEventHandler } from "react";

export interface RequestAccessHeaderProps {
  onLinkClick?: MouseEventHandler<HTMLAnchorElement>;
  appearance?: "onboarding" | "review";
}
