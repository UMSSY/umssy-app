import { BOLIVIA_OFFSET_MS, DAY_MS } from '../../../common/constants/date-time.constants.js';

const historicalTitles = [
  'Taller compartido de TypeScript',
  'Taller de arquitectura de software',
  'Taller de arquitectura de software',
  'Taller de interfaces accesibles y experiencias digitales'.padEnd(80, 'X'),
  'Taller con asistencia registrada',
  'Taller sin asistencia registrada',
  'Taller de bases de datos',
  'Taller de pruebas automatizadas',
  'Taller de servicios web',
  'Taller de seguridad aplicada',
  'Taller de diseño de productos',
  'Taller de análisis de datos',
  'Taller exclusivo del segundo usuario',
] as const;

export const HISTORY_EVENT_IDS = {
  historical: historicalTitles.map((_, index) =>
    `66666666-6666-6666-6666-${String(index + 1).padStart(12, '0')}`,
  ),
  cancelledRegistration: '66666666-6666-6666-6666-000000000014',
  boundary: '66666666-6666-6666-6666-000000000015',
  future: '66666666-6666-6666-6666-000000000016',
  boundarySession: '66666666-6666-6666-6666-000000000017',
} as const;

const historyLocation =
  'Edificio de Tecnología, laboratorio de interfaces y experiencias digitales'.padEnd(
    150,
    'X',
  );

function calendarDate(value: Date): Date {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
}

function localTime(value: Date): Date {
  const local = new Date(value.getTime() + BOLIVIA_OFFSET_MS);
  return new Date(
    Date.UTC(1970, 0, 1, local.getUTCHours(), local.getUTCMinutes()),
  );
}

export function buildHistoryEventScenarios(now: Date) {
  const historical = historicalTitles.map((title, index) => ({
    id: HISTORY_EVENT_IDS.historical[index],
    title,
    eventDate: calendarDate(new Date(now.getTime() - (20 + index * 3) * DAY_MS)),
    startTime: new Date('1970-01-01T09:00:00.000Z'),
    endTime: new Date('1970-01-01T12:00:00.000Z'),
    location: index === 3 ? historyLocation : 'Aula de demostración, UMSS',
  }));
  const boundaryEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 20),
  );
  const boundaryStart = new Date(boundaryEnd.getTime() - 40 * 60_000);
  const localBoundaryStart = new Date(boundaryStart.getTime() + BOLIVIA_OFFSET_MS);
  return {
    historical,
    cancelledRegistration: {
      id: HISTORY_EVENT_IDS.cancelledRegistration,
      title: 'Taller finalizado con inscripción cancelada',
      eventDate: calendarDate(new Date(now.getTime() - 70 * DAY_MS)),
      startTime: new Date('1970-01-01T09:00:00.000Z'),
      endTime: new Date('1970-01-01T12:00:00.000Z'),
      location: 'Aula de demostración, UMSS',
    },
    boundary: {
      id: HISTORY_EVENT_IDS.boundary,
      title: 'Taller de cierre controlado',
      eventDate: calendarDate(localBoundaryStart),
      startTime: localTime(boundaryStart),
      endTime: localTime(boundaryEnd),
      location: 'Aula de demostración, UMSS',
      startsAt: boundaryStart,
      endsAt: boundaryEnd,
    },
    future: {
      id: HISTORY_EVENT_IDS.future,
      title: 'Taller futuro de demostración',
      eventDate: calendarDate(new Date(now.getTime() + 30 * DAY_MS)),
      startTime: new Date('1970-01-01T09:00:00.000Z'),
      endTime: new Date('1970-01-01T12:00:00.000Z'),
      location: 'Aula de demostración, UMSS',
    },
  };
}
