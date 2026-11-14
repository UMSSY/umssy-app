import { APPLICATION_MESSAGES } from "../constants/application.constants";
import type { ApplicationsMobileListProps } from "../types/applications-mobile-list-props.types";
import { formatApplicationDate } from "../utils/format-application-date";
import { ApplicationActions } from "./application-actions";
import { ApplicationStatusBadge } from "./application-status-badge";

export function ApplicationsMobileList({
  applications,
  withdrawingId,
  onWithdraw,
  contactingId,
  onContact,
  onReactivate,
  reactivatingId,
}: ApplicationsMobileListProps) {
  return (
    <ul className="flex flex-col gap-3">
      {applications.map((application) => (
        <li
          key={application.id}
          className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 transition-colors focus-within:border-availability-border hover:border-availability-border hover:bg-availability/30"
        >
          <p className="font-semibold text-ink">{application.vacancyTitle}</p>
          <p className="text-sm text-text-secondary">{application.companyName}</p>
          <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
            <span>
              {APPLICATION_MESSAGES.affinity}: {application.affinityPercentage}%
            </span>
            <span>
              {APPLICATION_MESSAGES.date}: {formatApplicationDate(application.appliedDate)}
            </span>
            <ApplicationStatusBadge status={application.status} />
          </div>
          <ApplicationActions
            application={application}
            withdrawingId={withdrawingId}
            onWithdraw={onWithdraw}
            contactingId={contactingId}
            onContact={onContact}
            reactivatingId={reactivatingId}
            onReactivate={onReactivate}
            className="flex-wrap items-center"
          />
        </li>
      ))}
    </ul>
  );
}
