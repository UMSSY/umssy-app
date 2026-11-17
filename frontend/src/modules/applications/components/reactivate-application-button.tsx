import { Button } from "@/components/ui/button";

import type { ReactivateApplicationButtonProps } from "../types/reactivate-application-button-props.types";

export function ReactivateApplicationButton({
  applicationId,
  reactivatingId,
  onReactivate,
  className,
}: ReactivateApplicationButtonProps) {
  const isReactivating = reactivatingId === applicationId;

  return (
    <Button
      type="button"
      size="sm"
      variant="success"
      className={className}
      disabled={isReactivating}
      onClick={() => onReactivate(applicationId)}
    >
      {isReactivating ? "Reactivando…" : "Volver a postular"}
    </Button>
  );
}
