import type { ComponentProps, ReactNode } from "react";
import type { Input } from "@/components/ui/input";

export interface PersonalDataFieldProps extends ComponentProps<typeof Input> {
  id: string;
  onValueChange?: (value: string) => void;
  label: ReactNode;
  help?: string;
  icon?: ReactNode;
  isRequired?: boolean;
  error?: string;
}
