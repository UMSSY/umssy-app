import type { JobAlertOption } from "../types/job-alert-option.types";
import { HIGH_AFFINITY_THRESHOLD } from "./job-matching.constants";

export const JOB_ALERT_PREFERENCE_ENDPOINT = "/job-offers/alert-preference";

export const JOB_ALERT_PREFERENCE_QUERY_KEY = ["job-matching", "alert-preference"] as const;

export const JOB_ALERT_SKILLS_HREF = "/profile#skills";

export const JOB_ALERT_SKILLS_NOTICE_ID = "job-alert-skills-notice";

export const JOB_ALERT_OPTIONS: ReadonlyArray<JobAlertOption> = [
  {
    value: "ALL",
    label: "Todas las vacantes",
    description: "Te avisamos de cada vacante nueva que se publique.",
    requiresSkills: false,
  },
  {
    value: "MATCHING",
    label: "Solo las que coinciden con mi perfil",
    description: "Solo vacantes con afinidad mayor a 0 % con tus habilidades.",
    requiresSkills: true,
  },
  {
    value: "HIGH_AFFINITY",
    label: "Solo las de alta afinidad",
    description: `Solo vacantes con afinidad desde ${HIGH_AFFINITY_THRESHOLD} %.`,
    requiresSkills: true,
  },
];

export const JOB_ALERT_MESSAGES = {
  title: "Avisarme de nuevas vacantes",
  description: "Elige de cuáles quieres recibir un aviso. Se aplica a las próximas vacantes que se publiquen.",
  groupLabel: "Vacantes de las que quiero recibir aviso",
  loading: "Cargando tu preferencia de avisos...",
  loadError: "No pudimos cargar tu preferencia de avisos.",
  retry: "Reintentar",
  saved: "Guardamos tu preferencia. Se aplicará a las próximas vacantes que se publiquen.",
  saveError: "No pudimos guardar tu preferencia. Intenta nuevamente.",
  skillsRequired: "Para activar estas opciones, añade al menos una habilidad a tu perfil.",
  skillsLink: "Ir a Habilidades",
} as const;
