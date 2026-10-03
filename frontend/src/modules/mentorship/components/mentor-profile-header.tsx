import Image from "next/image";
import { GraduationCap, UserPlus } from "lucide-react";

import type { MentorProfile } from "../types/mentor-profile.types";

interface MentorProfileHeaderProps {
  mentor: MentorProfile;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function MentorProfileHeader({ mentor }: MentorProfileHeaderProps) {
  return (
    <section className="rounded-xl border border-umssy-border bg-white p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 shrink-0">
            {mentor.profileImage ? (
              <Image
                src={mentor.profileImage}
                alt={`Foto de ${mentor.name}`}
                fill
                className="rounded-full object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-umssy-border text-2xl font-bold text-umssy-ink">
                {getInitials(mentor.name)}
              </div>
            )}

            <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-umssy-red" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="break-words text-3xl font-extrabold text-umssy-ink">
                {mentor.name}
              </h1>

              <span className="inline-flex items-center gap-2 rounded-full border border-umssy-border bg-umssy-background px-3 py-1 text-sm text-umssy-secondary">
                <span className="h-2 w-2 rounded-full bg-umssy-red" />
                Disponible para mentoría
              </span>
            </div>

            <p className="mt-1 break-words text-lg font-semibold text-umssy-secondary">
              {mentor.specialty}
            </p>

            {mentor.professionalInterests.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase text-umssy-secondary">
                  Intereses profesionales
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {mentor.professionalInterests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-lg border border-umssy-border bg-umssy-background px-3 py-1 text-sm text-umssy-secondary"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 flex items-start gap-2 text-sm text-umssy-secondary">
              <GraduationCap
                size={18}
                className="mt-0.5 shrink-0 text-umssy-gold"
              />

              <p className="break-words">
                Egresado UMSS · {mentor.program} ({mentor.faculty})
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-umssy-red px-6 py-3 font-semibold text-white transition hover:brightness-90 sm:w-auto"
        >
          <UserPlus size={20} />
          Solicitar mentoría
        </button>
      </div>
    </section>
  );
}
