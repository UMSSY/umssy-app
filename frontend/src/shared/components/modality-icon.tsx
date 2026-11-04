import { BriefcaseBusiness, Building2, Laptop, Shuffle, type LucideIcon } from "lucide-react";
import type { ModalityIconProps } from "@/shared/types/modality-icon-props.types";

const MODALITY_ICONS: Readonly<Record<string, LucideIcon>> = {
  Presencial: Building2,
  Remoto: Laptop,
  Híbrido: Shuffle,
};

export function ModalityIcon({ modality, className }: ModalityIconProps) {
  const Icon = MODALITY_ICONS[modality] ?? BriefcaseBusiness;
  return <Icon aria-hidden="true" className={className} />;
}
