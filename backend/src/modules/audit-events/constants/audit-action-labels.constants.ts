import { AUDIT_ACTION, type AuditActionName } from '../types/audit-action.enum.js';
import { AUDIT_ACTOR_ROLE, type AuditActorRole } from '../types/audit-actor-role.enum.js';

export const AUDIT_ACTION_LABELS: Record<AuditActionName, string> = {
  [AUDIT_ACTION.SUBMITTED]: 'Solicitud enviada',
  [AUDIT_ACTION.OPENED]: 'Abierta para revisión',
  [AUDIT_ACTION.APPROVED]: 'Aprobada',
  [AUDIT_ACTION.REJECTED]: 'Rechazada',
  [AUDIT_ACTION.ACTIVATION_CODE_SENT]: 'Código de activación enviado',
  [AUDIT_ACTION.ACCOUNT_ACTIVATED]: 'Cuenta activada',
  [AUDIT_ACTION.DOCUMENT_REPLACED]: 'Documento reemplazado',
};

export const AUDIT_ACTOR_ROLE_LABELS: Record<AuditActorRole, string> = {
  [AUDIT_ACTOR_ROLE.ADMINISTRATIVE]: 'Administrativo',
  [AUDIT_ACTOR_ROLE.GRADUATE]: 'Titulado',
  [AUDIT_ACTOR_ROLE.SYSTEM]: 'Proceso automático',
};
