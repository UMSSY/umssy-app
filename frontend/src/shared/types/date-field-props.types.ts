import type { ComponentProps } from "react";
import type { Input } from "@/components/ui/input";

export interface DateFieldProps extends Omit<ComponentProps<typeof Input>, "type" | "value" | "defaultValue" | "onChange"> {
  value: string;
  onValueChange?: (value: string) => void;
}
