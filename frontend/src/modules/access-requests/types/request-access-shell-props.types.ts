import type { ReactNode } from "react";
import type { RequestStepsSidebarProps } from "./request-steps-sidebar-props.types";

export interface RequestAccessShellProps {
  currentStep: RequestStepsSidebarProps["currentStep"];
  header: ReactNode;
  children: ReactNode;
}