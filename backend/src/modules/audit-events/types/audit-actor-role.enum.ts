export const AUDIT_ACTOR_ROLE = {
  ADMINISTRATIVE: 'administrativo',
  GRADUATE: 'titulado',
  SYSTEM: 'sistema',
} as const;

export type AuditActorRole = (typeof AUDIT_ACTOR_ROLE)[keyof typeof AUDIT_ACTOR_ROLE];
