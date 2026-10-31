import type { RoleName } from '../../../common/enums/roles.enum.js';

export const AUDIT_ROLE: RoleName = 'administrativo';

export const DEFAULT_AUDIT_PAGE_SIZE = 10;
export const MAX_AUDIT_PAGE_SIZE = 50;

export const MIN_AUDIT_SEARCH_LENGTH = 2;
export const MAX_AUDIT_SEARCH_LENGTH = 100;

// Valor del filtro Responsable que representa las acciones automáticas
export const SYSTEM_RESPONSIBLE_ID = 'system';
export const SYSTEM_ACTOR_NAME = 'Sistema';

export const AUDIT_EVENT_CODE_PREFIX = 'EVT';
export const AUDIT_EVENT_CODE_DIGITS = 6;

export const MAX_AUDIT_DETAIL_LENGTH = 500;
