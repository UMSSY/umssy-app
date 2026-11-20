import type { TechnicalAreaResponse } from "./technical-area-response.types";

export interface TechnicalAreaCardProps {
  area: TechnicalAreaResponse;
  isSelected: boolean;
  onToggle: (id: string) => void;
}
