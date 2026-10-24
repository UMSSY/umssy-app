import { BriefcaseBusiness } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { MentorProfile } from "../../types/mentor-profile.types";

type MentorCareerProps = {
  mentor: MentorProfile;
};

export function MentorCareer({ mentor }: MentorCareerProps) {
  const currentExperience = mentor.workExperiences.find(
    (experience) => experience.isCurrent,
  );
  const education = mentor.educations[0];

  if (!currentExperience && !education) {
    return null;
  }

  return (
    <Card className="gap-0 overflow-visible rounded-xl border border-border bg-white py-0 text-base shadow-sm ring-0">
      <CardHeader className="px-6 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-surface-soft text-ink">
            <BriefcaseBusiness size={20} />
          </div>

          <CardTitle
            role="heading"
            aria-level={2}
            className="text-xl font-bold text-ink"
          >
            Trayectoria actual
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 px-6 pt-5 pb-6">
        {currentExperience && (
          <>
            <div>
              <p className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
                Cargo
              </p>

              <p className="mt-1 font-semibold [overflow-wrap:anywhere] text-ink">
                {currentExperience.position}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
                Empresa
              </p>

              <p className="mt-1 [overflow-wrap:anywhere] text-ink">
                {currentExperience.company.title}
              </p>
            </div>
          </>
        )}

        {education && (
          <div>
            {currentExperience && <Separator className="mb-4" />}

            <p className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
              Formación
            </p>

            <p className="mt-1 font-semibold [overflow-wrap:anywhere] text-ink">{education.degree}</p>
            <p className="mt-1 [overflow-wrap:anywhere] text-ink">{education.institution}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
