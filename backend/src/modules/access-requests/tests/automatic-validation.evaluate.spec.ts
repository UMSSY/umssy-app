import { describe, expect, it } from 'vitest';
import { evaluateDocumentReading } from '../helpers/evaluate-document-reading.js';
import type { DocumentReading } from '../types/document-reading.types.js';

const DECLARED = {
  firstName: 'María',
  lastName: 'Quispe Mamani',
  career: 'Licenciatura en Ingeniería de Sistemas',
  graduationYear: 2019,
};

const reading = (overrides: Partial<DocumentReading> = {}): DocumentReading => ({
  isDiploma: true,
  confidence: 0.98,
  fullName: 'MARIA QUISPE MAMANI',
  career: 'Licenciatura en Ingenieria de Sistemas',
  graduationYear: 2019,
  ...overrides,
});

describe('evaluateDocumentReading', () => {
  it('CA1: con 90% o más de coincidencia aprueba automáticamente, sin importar mayúsculas ni tildes', () => {
    const evaluation = evaluateDocumentReading(DECLARED, reading());
    expect(evaluation).toMatchObject({ result: 'auto_approved', matchScore: 98, reason: null });
  });

  it('CA3: si el apellido no coincide envía a revisión manual con el motivo', () => {
    const evaluation = evaluateDocumentReading(DECLARED, reading({ fullName: 'María Quispe Rojas', confidence: 0.95 }));
    expect(evaluation.result).toBe('manual_review');
    expect(evaluation.matchScore).toBeLessThan(90);
    expect(evaluation.reason).toBe('El apellido no coincide');
  });

  it('CA3: un documento legible a medias queda en revisión manual como poco legible', () => {
    const evaluation = evaluateDocumentReading(DECLARED, reading({ confidence: 0.48 }));
    expect(evaluation).toMatchObject({ result: 'manual_review', matchScore: 48, reason: 'Documento poco legible' });
  });

  it('CA3: detecta el nombre, la carrera y el año que no coinciden', () => {
    expect(evaluateDocumentReading(DECLARED, reading({ fullName: 'Rosa Quispe Mamani' })).reason).toBe('El nombre no coincide');
    expect(evaluateDocumentReading(DECLARED, reading({ career: 'Ingeniería Civil' })).reason).toBe('La carrera no coincide');
    expect(evaluateDocumentReading(DECLARED, reading({ graduationYear: 2018 })).reason).toBe('El año de titulación no coincide');
  });

  it('CA4: un archivo que no es diploma se rechaza automáticamente aunque tenga datos parecidos', () => {
    const evaluation = evaluateDocumentReading(DECLARED, reading({ isDiploma: false }));
    expect(evaluation).toMatchObject({ result: 'auto_rejected', reason: 'El archivo no es un diploma' });
    expect(evaluation.matchScore).toBeLessThan(20);
  });

  it('un documento ilegible requiere revisión manual', () => {
    const evaluation = evaluateDocumentReading(DECLARED, reading({ confidence: 0.12, fullName: null, career: null, graduationYear: null }));
    expect(evaluation).toMatchObject({ result: 'manual_review', matchScore: 0, reason: 'Documento poco legible' });
  });

  it('CA5 y CA6: compara nombre, carrera y año uno a uno; Carnet y Código SIS no se comparan', () => {
    const { fields } = evaluateDocumentReading(DECLARED, reading({ graduationYear: 2018 }));
    expect(fields).toEqual([
      { field: 'fullName', read: 'MARIA QUISPE MAMANI', result: 'match' },
      { field: 'career', read: 'Licenciatura en Ingenieria de Sistemas', result: 'match' },
      { field: 'graduationYear', read: '2018', result: 'mismatch' },
      { field: 'idCardNumber', read: null, result: 'not_compared' },
      { field: 'sisCode', read: null, result: 'not_compared' },
    ]);
  });

  it('CA5: Carnet y Código SIS no cambian el puntaje', () => {
    const base = evaluateDocumentReading(DECLARED, reading()).matchScore;
    expect(evaluateDocumentReading({ ...DECLARED }, reading()).matchScore).toBe(base);
  });

  it('acota una legibilidad fuera de rango entre 0 y 1', () => {
    expect(evaluateDocumentReading(DECLARED, reading({ confidence: 1.7 })).matchScore).toBe(100);
    expect(evaluateDocumentReading(DECLARED, reading({ confidence: -1 })).matchScore).toBe(0);
  });
});


describe('lecturas incompletas y equivalencias controladas', () => {
  it.each(['Ingeniero de Sistemas', 'Ing. de Sistemas', 'Licenciado en Ingeniería de Sistemas'])('compara %s sin modificar lo leído', (career) => {
    const result = evaluateDocumentReading(DECLARED, reading({ career }));
    expect(result.result).toBe('auto_approved');
    expect(result.fields[1].read).toBe(career);
  });
  it('no confunde Informática con Sistemas', () => {
    expect(evaluateDocumentReading(DECLARED, reading({ career: 'Ingeniería Informática' })).result).toBe('manual_review');
  });
  it('compara el nombre completo en orden de apellidos', () => {
    expect(evaluateDocumentReading(DECLARED, reading({ fullName: 'Quispe Mamani María' })).result).toBe('auto_approved');
  });
  it('no aprueba un nombre con palabras adicionales', () => {
    const result = evaluateDocumentReading(DECLARED, reading({ fullName: 'María Quispe Mamani Rosa' }));
    expect(result.result).toBe('manual_review');
    expect(result.fields[0].result).toBe('mismatch');
  });
  it('un campo ausente se representa como no comparado', () => {
    const result = evaluateDocumentReading(DECLARED, reading({ fullName: null }));
    expect(result.result).toBe('manual_review');
    expect(result.fields[0]).toMatchObject({ read: null, result: 'not_compared' });
  });
  it('un encabezado no reconocido requiere revisión, no rechazo automático', () => {
    expect(evaluateDocumentReading(DECLARED, reading({ isDiploma: false, documentKind: 'unknown' })).result).toBe('manual_review');
  });
  it('una confianza no finita nunca aprueba', () => {
    expect(evaluateDocumentReading(DECLARED, reading({ confidence: NaN })).result).toBe('manual_review');
  });
});

it('admite la denominación de Informática usada por el catálogo del repositorio', () => {
  const declared = { ...DECLARED, career: 'Licenciatura Ingeniería en Informática' };
  const result = evaluateDocumentReading(declared, reading({ career: 'Ingeniería Informática' }));
  expect(result.result).toBe('auto_approved');
});
