import { Badge } from "@/components/ui/badge";
import { APPLICATION_MESSAGES } from "../constants/application.constants";
import type { ApplicationsMobileListProps } from "../types/applications-mobile-list-props.types";
import { WithdrawApplicationButton } from "./withdraw-application-button";
import { ApplicationConsentsDialog } from "./application-consents-dialog";

export function ApplicationsMobileList({
  applications,
  withdrawingId,
  onWithdraw,
}: ApplicationsMobileListProps) {
  return (
    <ul className="flex flex-col gap-3">
      {applications.map((application) => (
        <li
          key={application.id}
          className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4"
        >
          <p className="font-semibold text-ink">{application.vacancyTitle}</p>
          <p className="text-sm text-text-secondary">
            {application.companyName}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
            <span>
              {APPLICATION_MESSAGES.affinity}: {application.affinityPercentage}%
            </span>
            <Badge variant="outline">{application.status}</Badge>
          </div>
          <ApplicationConsentsDialog application={application} />
          <WithdrawApplicationButton
            application={application}
            withdrawingId={withdrawingId}
            onWithdraw={onWithdraw}
            className="self-start"
          />
        </li>
      ))}
    </ul>
  );
}
