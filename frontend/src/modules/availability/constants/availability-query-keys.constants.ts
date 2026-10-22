export const AVAILABILITY_QUERY_KEYS = {
  all: ["availability"] as const,
  myBlocks: (weekStart: string) => ["availability", "my-blocks", weekStart] as const,
  freeBlocks: (mentorId: string, weekStart: string) =>
    ["availability", "free-blocks", mentorId, weekStart] as const,
  status: ["availability", "status"] as const,
  // Clave de useMentorProfile (Epic 6): su perfil muestra el botón «Solicitar mentoría».
  mentorProfile: (mentorId: string) => ["mentorship", "profile", mentorId] as const,
};
