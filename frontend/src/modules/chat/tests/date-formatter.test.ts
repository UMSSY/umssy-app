import { describe, it, expect } from 'vitest';
import { formatConversationDate, getInitials } from '../utils/date-formatter';

describe('date-formatter', () => {
  it('debe devolver string vacio si la fecha es nula, indefinida o invalida', () => {
    expect(formatConversationDate(null)).toBe('');
    expect(formatConversationDate(undefined)).toBe('');
    expect(formatConversationDate('fecha-invalida')).toBe('');
  });

    it('debe formatear la hora de hoy como hh:mm AM/PM', () => {
    const today = new Date();
    today.setHours(8, 40, 0, 0);
    expect(formatConversationDate(today.toISOString())).toBe('08:40 AM');

    today.setHours(0, 12, 0, 0);
    expect(formatConversationDate(today.toISOString())).toBe('12:12 AM');
  });

  it('debe devolver "Ayer" si la fecha es del dia anterior', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatConversationDate(yesterday.toISOString())).toBe('Ayer');
  });

  it('debe devolver fecha corta si es anterior a ayer', () => {
     const pad = (value: number) => String(value).padStart(2, '0');
    const daysAgo = (days: number) => {
      const date = new Date();
      date.setDate(date.getDate() - days);
      date.setHours(10, 0, 0, 0);
      return date;
    };
    const expectedFormat = (date: Date) =>
      `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${pad(date.getFullYear() % 100)}`;

    // anteayer, 10 dias y mas de un año atras
    [2, 10, 400].forEach((days) => {
      const date = daysAgo(days);
      const result = formatConversationDate(date.toISOString());

      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);
      expect(result).toBe(expectedFormat(date));
    });
  });

  it('debe obtener las iniciales correctamente', () => {
    expect(getInitials('')).toBe('U');
    expect(getInitials('Maria')).toBe('MA');
    expect(getInitials('Maria Fernandez')).toBe('MF');
    expect(getInitials('Carlos Alberto Torrico')).toBe('CT');
  });
});