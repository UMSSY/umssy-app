
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/shared/utils/get-initials";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import type { MentorDirectoryItem } from "../../types/mentor-directory.types";

type MentorCardProps = {
  mentor: MentorDirectoryItem;
  isOwnProfile?: boolean;
  returnTo?: string;
  showAffinityBadge?: boolean;
  selectedArea?: string;
};

function getSafeReturnTo(returnTo?: string): string | null {
  if (!returnTo) {
    return null;
  }

  if (
    !returnTo.startsWith("/mentorship/mentors") ||
    returnTo.startsWith("//") ||
    returnTo.includes("\\") ||
    returnTo.includes("#")
  ) {
    return null;
  }

  try {
    const url = new URL(returnTo, "http://localhost");

    if (url.origin !== "http://localhost") {
      return null;
    }

    if (url.pathname !== "/mentorship/mentors") {
      return null;
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

export function MentorCard({
  mentor,
  isOwnProfile = false,
  returnTo,
  showAffinityBadge = false,
  selectedArea,
}: MentorCardProps) {
  const hasTechnicalAreas = mentor.technicalAreas.length > 0;
  const safeReturnTo = getSafeReturnTo(returnTo);

  const profileHref = safeReturnTo
    ? `/mentors/${mentor.id}?returnTo=${encodeURIComponent(safeReturnTo)}`
    : `/mentors/${mentor.id}`;

  return (
    <Card
      className="h-full min-w-0 border-border bg-surface shadow-none"
      aria-labelledby={`mentor-${mentor.id}`}
    >
      <CardContent className="flex flex-1 flex-col gap-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex min-w-0 flex-1 basis-56 items-start gap-4">
            <Avatar className="size-14 shrink-0">
              {mentor.photoUrl ? (
                <AvatarImage
                  src={mentor.photoUrl}
                  alt={`Foto de ${mentor.fullName}`}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback>{getInitials(mentor.fullName)}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <h2
                id={`mentor-${mentor.id}`}
                className="text-lg font-semibold [overflow-wrap:anywhere] text-ink"
              >
                {mentor.fullName}
              </h2>

              {mentor.headline ? (
                <p className="mt-1 text-sm [overflow-wrap:anywhere] text-text-secondary">
                  {mentor.headline}
                </p>
              ) : null}

              {mentor.education ? (
                <p className="mt-2 text-sm [overflow-wrap:anywhere] text-text-secondary">
                  {mentor.education.degree} · {mentor.education.institution}
                </p>
              ) : null}
            </div>
          </div>

          <div className="ml-auto flex shrink-0 flex-col items-end gap-2">
            <Badge variant="outline" className="border-border bg-surface-soft px-2.5 whitespace-nowrap text-ink">
              {mentor.isAvailable ? "Disponible para mentoría" : "No disponible"}
            </Badge>
            {showAffinityBadge &&
              mentor.sharedInterestsCount !== undefined && (
                <Badge variant="secondary" className="whitespace-nowrap">
                  {mentor.sharedInterestsCount} {mentor.sharedInterestsCount === 1 ? "interés" : "intereses"} en común
                </Badge>
              )}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">
            Áreas técnicas
          </p>

          {hasTechnicalAreas ? (
            <ul className="flex flex-wrap gap-2">
              {mentor.technicalAreas.map((area) => (
                <li
                  key={area}
                  aria-current={area === selectedArea ? "true" : undefined}
                  className={cn("max-w-full min-w-0 rounded-md border bg-interaction px-2.5 py-1 text-xs [overflow-wrap:anywhere] text-accent", area === selectedArea ? "border-accent font-semibold ring-1 ring-accent" : "border-accent/15")}
                >
                  {area}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-secondary">
              Sin áreas registradas
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">
            Tipos de orientación
          </p>

          {mentor.orientationTypes.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {mentor.orientationTypes.map((orientationType) => (
                <li
                  key={orientationType}
                  className="max-w-full min-w-0 rounded-md border border-border bg-surface-soft px-2.5 py-1 text-xs [overflow-wrap:anywhere] text-ink-soft"
                >
                  {orientationType}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-secondary">
              Sin orientaciones registradas
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="mt-auto justify-end bg-surface">
        <Link
          href={profileHref}
          className={buttonVariants({
            variant: "outline",
            className: "max-w-full border-border-strong text-ink",
          })}
          aria-label={
            isOwnProfile
              ? `Ver mi perfil de ${mentor.fullName}`
              : `Ver perfil de ${mentor.fullName}`
          }
        >
          {isOwnProfile ? "Ver mi perfil" : "Ver perfil"}
        </Link>
      </CardFooter>
    </Card>
  );
}
