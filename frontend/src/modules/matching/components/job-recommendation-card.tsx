"use client";
import type { JobRecommendationCardProps } from "../types/job-recommendation-card-props.types";

import Link from "next/link";
import { Check, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card } from "@/components/ui/card";
import { getSafeMapsUrl } from "@/modules/job-offers";
import { ModalityIcon } from "@/shared/components/modality-icon";
import {
  HIGH_AFFINITY_THRESHOLD,
  JOB_MATCHING_MESSAGES,
  JOBS_ROUTE,
} from "../constants/job-matching.constants";

export function JobRecommendationCard({ job }: JobRecommendationCardProps) {
  const pendingSkills = job.skills.filter((skill) => !job.matchedSkills.includes(skill));
  const hasMatchedSkills = job.matchedSkills.length > 0;
  const isHighAffinity = job.score >= HIGH_AFFINITY_THRESHOLD;
  const locationUrl = getSafeMapsUrl(job.locationUrl);

  return (
    <Card className="h-full gap-3 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-tight text-lg font-bold text-ink">{job.title}</h2>
          <p className="text-sm text-text-secondary">{job.companyName}</p>
          <p className="flex items-center gap-1.5 text-sm text-text-secondary">
            <ModalityIcon modality={job.modality} className="size-3.5" />
            {job.modality}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
          <p className="text-sm font-semibold text-ink">
            {job.score}% {JOB_MATCHING_MESSAGES.affinityCaption}
          </p>
          {isHighAffinity ? (
            <Badge>{JOB_MATCHING_MESSAGES.highAffinityLabel}</Badge>
          ) : null}
        </div>
      </div>
      {job.skills.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
            {hasMatchedSkills
              ? JOB_MATCHING_MESSAGES.matchedLabel
              : "Habilidades requeridas"}
          </p>
          <ul className="flex flex-wrap gap-2">
            {job.matchedSkills.map((skill) => (
              <li key={skill}>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Check className="size-3" aria-hidden="true" />
                  {skill}
                </Badge>
              </li>
            ))}
            {pendingSkills.map((skill) => (
              <li key={skill}>
                <Badge variant="outline">{skill}</Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-auto flex items-center gap-3">
        {locationUrl ? (
          <a
            href={locationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "link" }),
              "h-auto gap-1 p-0 text-ink",
            )}
          >
            <MapPin className="size-3.5" aria-hidden="true" />
            {JOB_MATCHING_MESSAGES.viewLocation}
            <span className="sr-only"> de {job.title}</span>
          </a>
        ) : null}
        <Link
          href={`${JOBS_ROUTE}/${job.jobOfferId}`}
          className={cn(
            buttonVariants({ variant: "link" }),
            "ml-auto h-auto p-0 font-bold text-ink",
          )}
        >
          {JOB_MATCHING_MESSAGES.viewJob}
          <span className="sr-only"> {job.title}</span>
        </Link>
      </div>
    </Card>
  );
}
