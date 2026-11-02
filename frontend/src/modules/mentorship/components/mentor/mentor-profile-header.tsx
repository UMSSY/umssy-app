import { GraduationCap, UserPlus } from "lucide-react";
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

import type { MentorProfile } from "../../types/mentor-profile.types";

type MentorProfileHeaderProps = {
  mentor: MentorProfile;
  showRequestAction?: boolean;
};

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
  showRequestAction = true,
}: MentorProfileHeaderProps) {
  const primaryEducation = mentor.educations[0];
  const { requestMentorship, isChecking, hasNoSlots } = useRequestMentorship(mentor.id);

  return (
    <Card className="gap-0 overflow-visible rounded-xl border border-border bg-white py-0 text-base ring-0">
      <CardContent className="flex min-w-0 flex-col gap-6 p-4 sm:p-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar className="size-24 shrink-0 text-2xl">
            {mentor.photoUrl ? (
              <AvatarImage
                src={mentor.photoUrl}
                alt={`Foto de ${mentor.fullName}`}
                className="border-2 border-border object-cover"
              />
            ) : null}
            <AvatarFallback className="border-2 border-border bg-white text-2xl font-bold text-ink shadow-sm">
              {getInitials(mentor.fullName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="min-w-0 flex-1 basis-48 text-3xl font-extrabold [overflow-wrap:anywhere] text-ink">
                {mentor.fullName}
              </h1>
              <Badge
                variant="outline"
                className={cn("gap-1.5 px-2.5", mentor.isAvailable ? "border-transparent text-ink-soft" : "border-transparent text-text-secondary")}
              >
                <span
                  aria-hidden="true"
                  className={cn("size-1.5 shrink-0 rounded-full", mentor.isAvailable ? "bg-ink-soft" : "bg-text-secondary")}
                />
                {mentor.isAvailable ? "Disponible para mentoría" : "No disponible"}
              </Badge>
            </div>

            {mentor.headline?.trim() ? (
              <p className="mt-1 text-lg font-semibold [overflow-wrap:anywhere] text-text-secondary">
                {mentor.headline}
              </p>
            ) : <p className="mt-1 text-sm text-text-secondary">Especialidad no registrada</p>}

            {primaryEducation && (primaryEducation.degree?.trim() || primaryEducation.institution?.trim()) && (
              <div className="mt-3 flex items-start gap-2 text-sm text-text-secondary">
                <GraduationCap
                  size={18}
                  className="mt-0.5 shrink-0 text-ink-soft"
                />

                <p className="min-w-0 [overflow-wrap:anywhere]">
                  {[primaryEducation.degree?.trim(), primaryEducation.institution?.trim()].filter(Boolean).join(" · ")}
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
                className="h-auto w-full gap-2 rounded-lg border-0 bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:brightness-90 active:translate-y-0 sm:px-6 sm:text-base xl:w-auto"
              >
                <UserPlus className="size-5" />
                Solicitar mentoría
              </Button>
            ) : (
              <Button
                type="button"
                disabled
                className="h-auto w-full gap-2 rounded-lg border-0 bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-90 active:translate-y-0 sm:px-6 sm:text-base xl:w-auto"
              >
                <UserPlus className="size-5" />
                {REQUEST_MENTORSHIP_TEXT.disabledHint}
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
