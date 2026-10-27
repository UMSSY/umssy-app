"use client";

import { CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { JOB_APPLICATION_MESSAGES } from "../constants/job-application.constants";
import { useJobApplication } from "../hooks/use-job-application";
import type { JobApplicationActionProps } from "../types/job-application-action-props.types";
import { formatApplicationDate } from "../utils/format-application-date";

export function JobApplicationAction({ jobOfferId }: JobApplicationActionProps) {
  const {
    myApplication,
    isLoading,
    apply,
    isApplying,
    applyError,
    submittedApplication,
    resetSubmission,
  } = useJobApplication(jobOfferId);

  const application = myApplication?.application ?? null;

  return (
    <div className="flex flex-col items-end gap-1">
      {application ? (
        <>
          <Button size="sm" variant="secondary" disabled>
            <CircleCheck className="size-4" aria-hidden="true" />
            {JOB_APPLICATION_MESSAGES.alreadyApplied}
          </Button>
          <p className="flex items-center gap-2 text-xs text-text-secondary">
            {JOB_APPLICATION_MESSAGES.appliedOn} {formatApplicationDate(application.appliedAt)} ·
            <Badge variant="outline">{application.status}</Badge>
          </p>
        </>
      ) : (
        <Button size="sm" onClick={() => apply()} disabled={isLoading || isApplying}>
          {isApplying ? JOB_APPLICATION_MESSAGES.applying : JOB_APPLICATION_MESSAGES.apply}
        </Button>
      )}

      {applyError && (
        <p role="alert" className="text-xs text-destructive">
          {JOB_APPLICATION_MESSAGES.applyError}
        </p>
      )}

      <Dialog open={submittedApplication !== null} onOpenChange={(isOpen) => !isOpen && resetSubmission()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <CircleCheck className="size-6 text-ink" aria-hidden="true" />
            <DialogTitle>{JOB_APPLICATION_MESSAGES.successTitle}</DialogTitle>
            <DialogDescription>{JOB_APPLICATION_MESSAGES.successDescription}</DialogDescription>
          </DialogHeader>

          {submittedApplication && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-lg border border-border bg-surface-soft p-4 text-sm">
              <dt className="text-text-secondary">{JOB_APPLICATION_MESSAGES.summaryJob}</dt>
              <dd className="font-semibold text-ink">{submittedApplication.jobTitle}</dd>
              <dt className="text-text-secondary">{JOB_APPLICATION_MESSAGES.summaryCompany}</dt>
              <dd className="font-semibold text-ink">{submittedApplication.companyName}</dd>
              <dt className="text-text-secondary">{JOB_APPLICATION_MESSAGES.summaryDate}</dt>
              <dd className="font-semibold text-ink">{formatApplicationDate(submittedApplication.appliedAt)}</dd>
              <dt className="text-text-secondary">{JOB_APPLICATION_MESSAGES.summaryStatus}</dt>
              <dd>
                <Badge variant="outline">{submittedApplication.status}</Badge>
              </dd>
            </dl>
          )}

          <DialogFooter>
            <Button onClick={() => resetSubmission()}>{JOB_APPLICATION_MESSAGES.close}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
