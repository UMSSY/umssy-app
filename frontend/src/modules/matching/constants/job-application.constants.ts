export function getJobApplicationsEndpoint(jobOfferId: string): string {
  return `/job-offers/${jobOfferId}/applications`;
}

export function getMyJobApplicationEndpoint(jobOfferId: string): string {
  return `/job-offers/${jobOfferId}/applications/me`;
}

export const JOB_APPLICATION_QUERY_KEYS = {
  mine: (jobOfferId: string) => ["job-matching", "application", jobOfferId] as const,
};

export const JOB_APPLICATION_MESSAGES = {
  apply: "Enviar postulación",
  applying: "Enviando…",
  alreadyApplied: "Ya te postulaste",
  appliedOn: "Postulaste el",
  successTitle: "¡Postulación enviada!",
  successDescription: "Tu postulación se registró correctamente.",
  summaryJob: "Vacante",
  summaryCompany: "Empresa",
  summaryDate: "Fecha",
  summaryStatus: "Estado",
  close: "Entendido",
  applyError: "No pudimos enviar tu postulación. Intenta nuevamente.",
} as const;
