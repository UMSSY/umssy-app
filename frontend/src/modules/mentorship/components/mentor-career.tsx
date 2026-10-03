import { BriefcaseBusiness } from "lucide-react";
import type { MentorProfile } from "../types/mentor-profile.types";

interface MentorCareerProps {
  mentor: MentorProfile;
}

export function MentorCareer({ mentor }: MentorCareerProps) {
  return (
    <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-soft text-ink">
          <BriefcaseBusiness size={20} />
        </div>

        <h2 className="text-xl font-bold text-ink">Trayectoria actual</h2>
      </div>

      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Cargo actual
          </p>

          <p className="mt-1 break-words font-semibold text-ink">{mentor.position || "Cargo no registrado"}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Empresa
          </p>

          <p className="mt-1 text-ink">{mentor.company}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Experiencia
          </p>

          <p className="mt-1 text-ink">
            +{mentor.yearsExperience} años en la industria
          </p>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Facultad de egreso
          </p>

          <p className="mt-1 text-ink">{mentor.faculty}</p>
        </div>
      </div>
    </section>
  );
}
