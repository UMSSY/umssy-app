import type { RequirementStatus } from "./requirement-status.types";

export interface JobRequirement {
  name: string;
  status: RequirementStatus;
}
