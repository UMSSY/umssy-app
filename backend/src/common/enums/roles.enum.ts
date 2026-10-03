export const ROLE_NAMES = ['titulado', 'estudiante', 'mentor', 'empresa', 'administrativo'] as const;

export type RoleName = (typeof ROLE_NAMES)[number];
