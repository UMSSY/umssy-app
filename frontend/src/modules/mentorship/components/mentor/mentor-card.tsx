import type { MentorCardProps } from "../../types/mentor-card-props.types";
import { ArrowRight } from "lucide-react";

import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/shared/utils/get-initials';
import { buttonVariants } from '@/components/ui/button-variants';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

import { getSafeReturnTo } from '../../utils/get-safe-mentor-return-to';

export function MentorCard({
  mentor,
  isOwnProfile = false,
  returnTo,
  showAffinityBadge = false,
  selectedArea,
  highlightAvailability = false,
}: MentorCardProps) {
  const hasTechnicalAreas = mentor.technicalAreas.length > 0;
  const safeReturnTo = getSafeReturnTo(returnTo);

  const profileHref = safeReturnTo
    ? `/mentors/${mentor.id}?returnTo=${encodeURIComponent(safeReturnTo)}`
    : `/mentors/${mentor.id}`;

  return (
    <Card
      className="relative h-full min-w-0 gap-4 rounded-none border border-border bg-surface py-[22px] shadow-none ring-0"
      aria-labelledby={`mentor-${mentor.id}`}
    >
      <CardContent className="flex flex-1 flex-col gap-3 px-[22px]">
        <div className="flex flex-col items-start gap-2">
          <div className="flex w-full min-w-0 flex-col items-start gap-5">
            <Avatar className="size-[58px] shrink-0">
              {mentor.photoUrl ? (
                <AvatarImage
                  src={mentor.photoUrl}
                  alt={`Foto de ${mentor.fullName}`}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-[#d5e6ef] text-sm font-semibold text-accent">{getInitials(mentor.fullName)}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <h2
                id={`mentor-${mentor.id}`}
                className="[font-family:Georgia,serif] text-[20px] leading-6 font-semibold [overflow-wrap:anywhere] text-accent"
              >
                {mentor.fullName}
              </h2>

              {mentor.headline ? (
                <p className="mt-1 text-xs font-semibold [overflow-wrap:anywhere] text-ink-soft">
                  {mentor.headline}
                </p>
              ) : null}

              {mentor.education ? (
                <p className="mt-1 text-xs [overflow-wrap:anywhere] text-text-secondary">
                  {mentor.education.degree} · {mentor.education.institution}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 empty:hidden">
            {mentor.isAvailable ? (
              <Badge
                variant="outline"
                aria-current={highlightAvailability ? 'true' : undefined}
                className={cn(
                  "absolute top-[22px] right-[22px] border-transparent bg-transparent px-0 text-[10px] whitespace-nowrap text-[#246448]",
                  highlightAvailability && "font-semibold",
                )}
              >
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-[#3b9e70]"
                />
                Disponible para mentoría
              </Badge>
            ) : null}
            {showAffinityBadge && mentor.sharedInterestsCount !== undefined && (
              <Badge variant="secondary" className="whitespace-nowrap">
                {mentor.sharedInterestsCount}{' '}
                {mentor.sharedInterestsCount === 1 ? 'interés' : 'intereses'} en
                común
              </Badge>
            )}
          </div>
        </div>

        <div>
          <p className="sr-only">Áreas técnicas</p>

          {hasTechnicalAreas ? (
            <ul className="flex flex-wrap gap-2">
              {mentor.technicalAreas.map((area) => (
                <li
                  key={area}
                  aria-current={area === selectedArea ? 'true' : undefined}
                  className={cn(
                    "max-w-full min-w-0 rounded-[2px] border bg-interaction px-2 py-1 text-[10px] [overflow-wrap:anywhere] text-accent",
                    area === selectedArea
                      ? 'border-accent font-semibold ring-1 ring-accent'
                      : 'border-accent/15',
                  )}
                >
                  {area}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-secondary">Sin áreas registradas</p>
          )}
        </div>

        <div>
          <p className="sr-only">
            Tipos de orientación
          </p>

          {mentor.orientationTypes.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {mentor.orientationTypes.map((orientationType) => (
                <li
                  key={orientationType}
                  className="max-w-full min-w-0 rounded-[2px] bg-surface-soft px-2 py-1 text-[10px] [overflow-wrap:anywhere] text-ink-soft"
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

      <CardFooter className="mx-[22px] mt-auto border-t border-border bg-surface px-0 pt-4">
        <Link
          href={profileHref}
          className={buttonVariants({
            variant: "outline",
            className: "h-[38px] w-full gap-3 rounded-none border-accent! bg-surface text-xs text-accent hover:bg-accent hover:text-accent-foreground",
          })}
          aria-label={
            isOwnProfile
              ? `Ver mi perfil de ${mentor.fullName}`
              : `Ver perfil de ${mentor.fullName}`
          }
        >
          {isOwnProfile ? "Ver mi perfil" : "Ver perfil"}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </CardFooter>
    </Card>
  );
}
