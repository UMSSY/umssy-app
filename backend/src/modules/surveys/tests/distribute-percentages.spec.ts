import { describe, expect, it } from 'vitest';
import { distributePercentages } from '../utils/distribute-percentages.js';

const sum = (values: readonly number[]) =>
  Number(values.reduce((total, value) => total + value, 0).toFixed(1));

describe('distributePercentages', () => {
  it('reparte exactamente cuando la división es limpia', () => {
    expect(distributePercentages([2, 0, 3, 0])).toEqual([40, 0, 60, 0]);
  });

  it('hace que tres opciones iguales sumen 100% y no 99.9%', () => {
    const result = distributePercentages([1, 1, 1]);

    expect(result).toEqual([33.4, 33.3, 33.3]);
    expect(sum(result)).toBe(100);
  });

  it('siempre suma 100% con cualquier distribución', () => {
    [
      [7, 1, 1],
      [5, 5, 5, 5, 5, 5, 5],
      [132, 26, 31, 12, 37, 8],
      [1, 0, 0, 0, 0, 0, 2],
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    ].forEach((counts) => {
      expect(sum(distributePercentages(counts))).toBe(100);
    });
  });

  it('mantiene el orden: más votos nunca recibe menos porcentaje', () => {
    const result = distributePercentages([10, 3, 6]);

    expect(result[0]).toBeGreaterThanOrEqual(result[2]);
    expect(result[2]).toBeGreaterThanOrEqual(result[1]);
  });

  it('una opción sin elecciones queda en 0 y no recibe décimas sobrantes', () => {
    expect(distributePercentages([1, 1, 1, 0])[3]).toBe(0);
  });

  it('devuelve ceros sin dividir por cero cuando no hay elecciones', () => {
    expect(distributePercentages([0, 0, 0])).toEqual([0, 0, 0]);
    expect(distributePercentages([])).toEqual([]);
  });
});
