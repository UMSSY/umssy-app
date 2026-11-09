import type { RoleName } from '../../../common/enums/roles.enum.js';

export const USER_TYPE_LABELS: Record<RoleName, string> = {
  titulado: 'Titulado',
  estudiante: 'Estudiante',
  mentor: 'Mentor',
  empresa: 'Empresa',
  administrativo: 'Administrativo',
};

export const REPORT_USER_CSV_HEADERS = [
  'Usuario',
  'Correo',
  'Tipo de Usuario',
  'Identificador',
  'Documento',
  'Fecha de Registro',
] as const;
