import { DAY_MS } from '../../../common/constants/date-time.constants.js';
import { toUtcIso } from '../../../common/utils/date-time.js';

// Incluye desde el inicio del día inicial hasta antes del inicio del día siguiente al final, en hora de Bolivia
export function toBoliviaDayRange(from?: string, to?: string): { gte?: Date; lt?: Date } {
  return {
    ...(from && { gte: new Date(toUtcIso(from, '00:00')) }),
    ...(to && { lt: new Date(new Date(toUtcIso(to, '00:00')).getTime() + DAY_MS) }),
  };
}
