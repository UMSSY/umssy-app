import { Button } from "@/components/ui/button";
import { APPLICATION_MESSAGES } from "../constants/application.constants";
import type { ShowWithdrawnToggleProps } from "../types/show-withdrawn-toggle-props.types";

export function ShowWithdrawnToggle({ pressed, onPressedChange }: ShowWithdrawnToggleProps) {
  return (
    <Button
      type="button"
      variant={pressed ? "default" : "outline"}
      aria-pressed={pressed}
      className="rounded-full"
      onClick={() => onPressedChange(!pressed)}
    >
      {APPLICATION_MESSAGES.withdrawnApplications}
    </Button>
  );
}
