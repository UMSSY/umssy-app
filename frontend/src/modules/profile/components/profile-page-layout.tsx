import type { ProfilePageLayoutProps } from "../types/profile-page-layout-props.types";
import { WorkspacePage } from "@/shared/components/layout/workspace-page";

export function ProfilePageLayout({ title, description, actions, children }: ProfilePageLayoutProps) {
  return <WorkspacePage title={title} description={description} actions={actions} className="max-w-profile space-y-8">{children}</WorkspacePage>;
}
