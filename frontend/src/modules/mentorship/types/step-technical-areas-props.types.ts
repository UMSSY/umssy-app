import type { TechnicalAreaResponse } from "./technical-area-response.types";

export type StepTechnicalAreasProps = {
  technicalAreas: TechnicalAreaResponse[];
  selectedIds: string[];
  onToggle: (id: string) => void;
};
