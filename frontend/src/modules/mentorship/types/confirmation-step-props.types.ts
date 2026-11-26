import type { OrientationTypeResponse } from "./orientation-type-response.types";
import type { TechnicalAreaResponse } from "./technical-area-response.types";

export type ConfirmationStepProps = {
  wantsToParticipate: boolean;
  selectedTechnicalAreas: TechnicalAreaResponse[];
  selectedOrientationTypes: OrientationTypeResponse[];
  isActivating: boolean;
  activationError: string | null;
  onEditTechnicalAreas: () => void;
  onEditOrientationTypes: () => void;
  onActivate: () => void | Promise<void>;
};
