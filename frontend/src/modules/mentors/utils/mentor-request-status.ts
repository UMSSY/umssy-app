
export const mentorRequestStatusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  OFFERED: "Cupo ofrecido",
  ACTIVE: "Aceptada",
  ENDED: "Finalizada",
  CANCELLED: "Cancelada",
  EXPIRED: "Vencida",
};

export function getMentorRequestStatusLabel(status: string): string {
  return mentorRequestStatusLabels[status] ?? status;
}
