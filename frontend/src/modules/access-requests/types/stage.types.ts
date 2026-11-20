import type { StageState } from "./stage-state.types";

export interface Stage {
  label: string;
  detail: string;
  state: StageState;
}
