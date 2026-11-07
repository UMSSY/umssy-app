import { Button } from "@/components/ui/button";
import { APPLICATION_MESSAGES, WITHDRAWABLE_STATUSES } from "../constants/application.constants";
import type { WithdrawApplicationButtonProps } from "../types/withdraw-application-button-props.types";

export function WithdrawApplicationButton({
  application,
  withdrawingId,
  onWithdraw,
  className,
}: WithdrawApplicationButtonProps) {
  const isWithdrawing = withdrawingId === application.id;
  const canWithdraw = WITHDRAWABLE_STATUSES.includes(application.status);

  return (
    <Button
      variant="destructive"
      size="sm"
      className={className}
      disabled={!canWithdraw || isWithdrawing}
      onClick={() => onWithdraw(application.id)}
    >
      {isWithdrawing ? APPLICATION_MESSAGES.withdrawing : APPLICATION_MESSAGES.withdraw}
    </Button>
  );
}
