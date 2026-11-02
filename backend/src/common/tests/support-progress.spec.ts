import { describe, expect, it } from 'vitest';
import {
  calculateProgressPercent,
  calculateSupportsRemaining,
} from '../utils/support-progress.js';

describe('calculateSupportsRemaining', () => {
  it('resta los apoyos al umbral', () => {
    expect(calculateSupportsRemaining(14, 20)).toBe(6);
  });

  it('nunca devuelve negativos', () => {
    expect(calculateSupportsRemaining(25, 20)).toBe(0);
  });

  it('devuelve 0 si no hay umbral', () => {
    expect(calculateSupportsRemaining(3, null)).toBe(0);
  });
});

describe('calculateProgressPercent', () => {
  it('calcula el porcentaje redondeado', () => {
    expect(calculateProgressPercent(14, 20)).toBe(70);
    expect(calculateProgressPercent(15, 20)).toBe(75);
    expect(calculateProgressPercent(1, 20)).toBe(5);
  });

  it('funciona con el umbral mínimo de 8', () => {
    expect(calculateProgressPercent(4, 8)).toBe(50);
  });

  it('no pasa de 100', () => {
    expect(calculateProgressPercent(25, 20)).toBe(100);
  });

  it('devuelve 0 si el umbral es null o 0', () => {
    expect(calculateProgressPercent(5, null)).toBe(0);
    expect(calculateProgressPercent(5, 0)).toBe(0);
  });
});