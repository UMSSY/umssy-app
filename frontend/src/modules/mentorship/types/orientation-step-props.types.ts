import type { OrientationTypeResponse } from "./orientation-type-response.types";

export type OrientationStepProps = {
  orientationTypes: OrientationTypeResponse[];
  selectedOrientationTypeIds: string[];
  onSelectionChange: (ids: string[]) => void;
};
