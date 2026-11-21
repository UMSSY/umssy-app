import { cn } from "@/lib/utils";
import { WITHDRAWN_STATUS } from "../constants/application.constants";
import type { ApplicationActionsProps } from "../types/application-actions-props.types";
import { ContactApplicationButton } from "./contact-application-button";
import { ReactivateApplicationButton } from "./reactivate-application-button";
import { WithdrawApplicationButton } from "./withdraw-application-button";

export function ApplicationActions({
  application,
  withdrawingId,
  onWithdraw,
  contactingId,
  onContact,
  reactivatingId,
  onReactivate,
  className,
}: ApplicationActionsProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      <ContactApplicationButton application={application} contactingId={contactingId} onContact={onContact} />
      {application.status === WITHDRAWN_STATUS && onReactivate ? (
        <ReactivateApplicationButton
          applicationId={application.id}
          reactivatingId={reactivatingId}
          onReactivate={onReactivate}
        />
      ) : (
        <WithdrawApplicationButton application={application} withdrawingId={withdrawingId} onWithdraw={onWithdraw} />
      )}
    </div>
  );
}
