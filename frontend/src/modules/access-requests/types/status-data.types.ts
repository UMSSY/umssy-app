import type { ActivationResult } from "./activation-result.types";
import type { ActivationStatus } from "./activation-status.types";

export interface StatusData {
  result: ActivationResult<ActivationStatus>;
  offsetMs: number;
}
