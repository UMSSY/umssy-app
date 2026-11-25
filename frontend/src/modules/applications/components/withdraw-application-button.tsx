import { Button } from "@/components/ui/button";
import { APPLICATION_MESSAGES, WITHDRAWN_STATUS } from "../constants/application.constants";
import type { WithdrawApplicationButtonProps } from "../types/withdraw-application-button-props.types";

export function WithdrawApplicationButton({
  application,
  withdrawingId,
  onWithdraw,
  className,
}: WithdrawApplicationButtonProps) {
  const isWithdrawing = withdrawingId === application.id;
  const canWithdraw = application.status !== WITHDRAWN_STATUS;

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      disabled={!canWithdraw || isWithdrawing}
      onClick={() => onWithdraw(application.id)}
    >
      {isWithdrawing ? APPLICATION_MESSAGES.withdrawing : APPLICATION_MESSAGES.withdraw}
    </Button>
  );
}
