import type { TechnicalAreaResponse } from "@/modules/mentorship";
export type TechnicalAreaCardProps = {
  area: TechnicalAreaResponse;
  isSelected: boolean;
  onToggle: (id: string) => void;
};
