import { BLOCK_STEP_MINUTES } from './create-block.constants.js';

export const MS_PER_MINUTE = 60_000;
export const MS_PER_DAY = 86_400_000;
export const STEP_MS = BLOCK_STEP_MINUTES * MS_PER_MINUTE;

export const PERFORMANCE_APPOINTMENTS = 50;
export const PRIMARY_APPOINTMENTS = 3;
export const SERIES_OCCURRENCES = 3;
// Bloques sin cita de mentor.a: uno libre y uno bajo la fecha bloqueada.
export const PRIMARY_FREE_BLOCKS = 2;

const SEED_APPOINTMENT_COUNT = PRIMARY_APPOINTMENTS + PERFORMANCE_APPOINTMENTS;
const SEED_BLOCK_COUNT = SEED_APPOINTMENT_COUNT + PRIMARY_FREE_BLOCKS + SERIES_OCCURRENCES;

// Identidades reservadas a B-08: no dependen de la fecha de ejecución.
export const SEED_BLOCK_IDS = Array.from({ length: SEED_BLOCK_COUNT }, (_, index) =>
  `b0800000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
);
export const SEED_APPOINTMENT_IDS = Array.from({ length: SEED_APPOINTMENT_COUNT }, (_, index) =>
  `b0800001-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
);
export const SEED_BLOCKED_DATE_ID = 'b0800002-0000-4000-8000-000000000001';
export const SEED_SERIES_ID = 'b0800003-0000-4000-8000-000000000001';

export const SEED_APPOINTMENT_MESSAGE = 'Cita confirmada de prueba B-08 (seed de desarrollo)';
export const SEED_BLOCKED_REASON = 'Compromiso académico (seed B-08)';
// Mensajes con los que el seed anterior a B-08 identificaba sus citas.
export const LEGACY_SEED_MESSAGES: string[] = [
  'Cita de prueba pendiente (seed de desarrollo)',
  'Cita de prueba confirmada (seed de desarrollo)',
];

export const SEED_AVAILABILITY_MESSAGES = {
  noFutureSlot:
    'La semana actual ya no tiene horarios futuros entre 07:00 y 22:00; se conserva una cita transcurrida de esta semana y las próximas de la siguiente.',
  foreignBlock: (id: string) => `B-08: el bloque ${id} tiene propietario o referencias ajenas; no se reemplazará.`,
  foreignAppointment: (id: string) =>
    `B-08: la cita ${id} tiene participantes o referencias ajenas; no se reemplazará.`,
  foreignBlockedDate: 'B-08: la identidad de la fecha bloqueada pertenece a otro mentor.',
  collision: (start: string) =>
    `B-08: el horario ${start} colisiona con datos ajenos; se conserva la información existente.`,
  blockedDayBusy: 'B-08: la fecha a bloquear contiene citas activas o un bloqueo ajeno.',
  sameParticipants: 'B-08: se requieren dos mentores y un titulado distintos.',
  legacyRemoved: (appointments: number, blocks: number) =>
    `Se retiraron ${appointments} citas del seed anterior y ${blocks} bloques que ocupaban horarios de B-08.`,
  missingOrientation: 'B-08: ejecuta primero el seed de tipos de orientación; no existe un tema activo.',
} as const;
