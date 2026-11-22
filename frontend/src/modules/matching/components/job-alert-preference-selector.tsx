"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  JOB_ALERT_MESSAGES,
  JOB_ALERT_OPTIONS,
  JOB_ALERT_SKILLS_HREF,
  JOB_ALERT_SKILLS_NOTICE_ID,
} from "../constants/job-alert-preference.constants";
import { useJobAlertPreference } from "../hooks/use-job-alert-preference";
import type { JobAlertMode } from "../types/job-alert-mode.types";

export function JobAlertPreferenceSelector() {
  const { preference, isLoading, isError, refetch, save, isSaving, hasSaved } = useJobAlertPreference();

  function handleChange(value: string) {
    const mode = value as JobAlertMode;
    if (!preference || mode === preference.mode) return;
    save(mode);
  }

  return (
    <section
      aria-labelledby="job-alert-title"
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
    >
      <header className="flex flex-col gap-1">
        <h2 id="job-alert-title" className="flex items-center gap-2 font-tight text-lg font-bold text-ink">
          <Bell aria-hidden="true" className="size-5 text-accent" />
          {JOB_ALERT_MESSAGES.title}
        </h2>
        <p className="text-sm text-text-secondary">{JOB_ALERT_MESSAGES.description}</p>
      </header>

      {isLoading && (
        <div aria-busy="true" role="status" aria-label={JOB_ALERT_MESSAGES.loading}>
          <Skeleton className="h-24 rounded-lg" />
        </div>
      )}

      {isError && !preference && (
        <div role="alert" className="flex flex-col items-start gap-2">
          <p className="text-sm text-ink">{JOB_ALERT_MESSAGES.loadError}</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            {JOB_ALERT_MESSAGES.retry}
          </Button>
        </div>
      )}

      {preference && (
        <>
          <RadioGroup
            value={preference.mode}
            onValueChange={handleChange}
            disabled={isSaving}
            aria-label={JOB_ALERT_MESSAGES.groupLabel}
            className="flex flex-col gap-2"
          >
            {JOB_ALERT_OPTIONS.map(({ value, label, description, requiresSkills }) => {
              const isLocked = requiresSkills && !preference.canFilterByProfile;

              return (
                <Label
                  key={value}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border-2 border-border bg-surface p-3 transition-colors",
                    "has-data-checked:border-primary has-data-checked:bg-interaction",
                    "has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                    isLocked ? "cursor-not-allowed bg-muted opacity-60" : "cursor-pointer hover:bg-accent/5",
                  )}
                >
                  <RadioGroupItem
                    value={value}
                    disabled={isLocked}
                    aria-describedby={isLocked ? JOB_ALERT_SKILLS_NOTICE_ID : undefined}
                    className="mt-0.5"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink">{label}</span>
                    <span className="mt-0.5 block text-sm font-normal text-text-secondary">{description}</span>
                  </span>
                </Label>
              );
            })}
          </RadioGroup>

          {!preference.canFilterByProfile && (
            <p
              id={JOB_ALERT_SKILLS_NOTICE_ID}
              className="flex flex-wrap items-center gap-x-2 text-sm text-text-secondary"
            >
              {JOB_ALERT_MESSAGES.skillsRequired}{" "}
              <Link href={JOB_ALERT_SKILLS_HREF} className="font-semibold text-accent underline underline-offset-2">
                {JOB_ALERT_MESSAGES.skillsLink}
              </Link>
            </p>
          )}

          {hasSaved && !isSaving && (
            <p role="status" className="text-sm text-text-secondary">
              {JOB_ALERT_MESSAGES.saved}
            </p>
          )}
        </>
      )}
    </section>
  );
}
