"use client";
import type { MentorProfileHeaderProps } from "../../types/mentor-profile-header-props.types";

import { ArrowRight, GraduationCap, UserPlus } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { REQUEST_MENTORSHIP_TEXT, useRequestMentorship } from "@/modules/availability";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function MentorProfileHeader({
  mentor,
  selectedArea,
  showRequestAction = true,
  selectedAreaId,
  returnTo,
}: MentorProfileHeaderProps) {
  const primaryEducation = mentor.educations[0];
  const currentCompany = mentor.workExperiences.find(experience => experience.isCurrent)?.company.title;
  const { requestMentorship, isChecking, hasNoSlots } = useRequestMentorship(mentor.id, selectedArea, returnTo, selectedAreaId);

  return (
    <Card className="gap-0 overflow-visible rounded-none border border-border bg-interaction py-0 text-sm shadow-none ring-0">
      <CardContent className="flex min-w-0 flex-col gap-6 p-5 sm:p-8 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-6 sm:flex-row sm:items-center">
          <Avatar className="size-24 shrink-0 text-2xl">
            {mentor.photoUrl ? (
              <AvatarImage
                src={mentor.photoUrl}
                alt={`Foto de ${mentor.fullName}`}
                className="border-2 border-border object-cover"
              />
            ) : null}
            <AvatarFallback className="bg-accent/10 text-[22px] font-semibold text-accent">
              {getInitials(mentor.fullName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col flex-wrap items-start gap-2">
              <h1 className="min-w-0 font-tight text-3xl font-semibold tracking-tight [overflow-wrap:anywhere] text-accent sm:text-[36px]">
                {mentor.fullName}
              </h1>
              <Badge
                variant="outline"
                className={cn(
                  "-order-1 gap-1.5 border-transparent bg-transparent px-0 text-[10px]",
                  mentor.isAvailable
                    ? "text-success"
                    : "border-transparent text-text-secondary",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    mentor.isAvailable ? "bg-success" : "bg-text-secondary",
                  )}
                />
                {mentor.isAvailable
                  ? "Disponible para mentoría"
                  : "No disponible"}
              </Badge>
            </div>

            {mentor.headline?.trim() ? (
              <p className="mt-2 text-sm [overflow-wrap:anywhere] text-text-secondary">
                <span className="[overflow-wrap:anywhere]">{mentor.headline}</span>{currentCompany ? ` · ${currentCompany}` : ""}
              </p>
            ) : (
              <p className="mt-1 text-sm text-text-secondary">
                Especialidad no registrada
              </p>
            )}

            {mentor.technicalAreas.length > 0 ? <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Especialidades del mentor">{mentor.technicalAreas.map(area => <li key={area.id} className="rounded-[2px] bg-interaction px-2 py-1 text-[11px] text-accent">{area.name}</li>)}</ul> : null}

            {primaryEducation &&
              (primaryEducation.degree?.trim() ||
                primaryEducation.institution?.trim()) && (
                <div className="mt-3 flex items-start gap-2 text-sm text-text-secondary">
                  <GraduationCap
                    size={18}
                    className="mt-0.5 shrink-0 text-ink-soft"
                  />

                  <p className="min-w-0 [overflow-wrap:anywhere]">
                    {[
                      primaryEducation.degree?.trim(),
                      primaryEducation.institution?.trim(),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              )}
          </div>
        </div>

        {showRequestAction && (
          <div className="flex w-full shrink-0 flex-col gap-2 xl:w-auto">
            {mentor.isAvailable ? (
              <Button
                type="button"
                onClick={requestMentorship}
                disabled={isChecking}
                className="h-11 w-full gap-4 rounded-sm border-0 bg-accent px-4 text-xs font-semibold text-accent-foreground transition hover:brightness-90 active:translate-y-0 sm:px-6 xl:w-auto"
              >
                Solicitar mentoría
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                type="button"
                disabled
                className="h-auto w-full gap-2 rounded-lg border-0 bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-90 active:translate-y-0 sm:px-6 sm:text-base xl:w-auto"
              >
                <UserPlus className="size-5" aria-hidden="true" />
                <span className="min-w-0 whitespace-normal">
                  {REQUEST_MENTORSHIP_TEXT.disabledHint}
                </span>
              </Button>
            )}
            {hasNoSlots && (
              <Alert variant="destructive">
                <AlertTitle>{REQUEST_MENTORSHIP_TEXT.noSlots}</AlertTitle>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
