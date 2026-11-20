import { describe, expect, it } from 'vitest';

import { surveyAlertConfigSchema } from '../requests/survey-alert-config.schema.js';

function firstMessage(input: unknown): string | undefined {
  const result = surveyAlertConfigSchema.safeParse(input);
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe('surveyAlertConfigSchema', () => {
  it.each([{}, { threshold: undefined }, { threshold: null }])(
    'rechaza el umbral vacío indicando que es requerido (%j)',
    (input) => {
      expect(firstMessage({ enabled: true, ...input })).toBe(
        'El umbral es requerido',
      );
    },
  );

  it('rechaza un umbral que no es numérico', () => {
    expect(firstMessage({ threshold: 'abc' })).toBe(
      'El umbral debe ser un número entero',
    );
  });

  it('rechaza decimales, 0 y 51 con mensajes específicos', () => {
    expect(firstMessage({ threshold: 2.5 })).toBe(
      'El umbral debe ser un número entero',
    );
    expect(firstMessage({ threshold: 0 })).toBe(
      'El umbral mínimo es 1 punto porcentual',
    );
    expect(firstMessage({ threshold: 51 })).toBe(
      'El umbral máximo es 50 puntos porcentuales',
    );
  });

  it.each([1, 50])('acepta el valor límite %i', (threshold) => {
    expect(firstMessage({ threshold })).toBeUndefined();
  });
});
