import { describe, expect, it } from 'vitest';
import { splitIntoBlocks } from '../utils/split-into-blocks.js';

const at = (time: string) => new Date(`2026-11-03T${time}:00.000Z`);

describe('splitIntoBlocks', () => {
  it('divide 10:00 a 14:30 en tres bloques seguidos de 1 h 30', () => {
    expect(splitIntoBlocks(at('14:00'), at('18:30'))).toEqual([
      { startAt: at('14:00'), endAt: at('15:30') },
      { startAt: at('15:30'), endAt: at('17:00') },
      { startAt: at('17:00'), endAt: at('18:30') },
    ]);
  });

  it('devuelve un solo bloque para un rango de 1 h 30', () => {
    expect(splitIntoBlocks(at('14:00'), at('15:30'))).toEqual([
      { startAt: at('14:00'), endAt: at('15:30') },
    ]);
  });

  it('no devuelve bloques si el rango dura menos de 1 h 30', () => {
    expect(splitIntoBlocks(at('14:00'), at('15:00'))).toEqual([]);
  });
});
