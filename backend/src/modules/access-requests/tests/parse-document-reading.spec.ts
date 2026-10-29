import { describe, expect, it } from 'vitest';
import { parseDocumentReading } from '../helpers/parse-document-reading.js';

const DECLARED = { firstName: 'María', lastName: 'Quispe Mamani', career: 'Licenciatura en Ingeniería de Sistemas', graduationYear: 2019 };

const DIPLOMA = [
  'UNIVERSIDAD MAYOR DE SAN SIMÓN',
  'DIPLOMA ACADÉMICO',
  'Se confiere a',
  'MARÍA QUISPE MAMANI',
  'el grado de LICENCIATURA EN INGENIERÍA DE SISTEMAS',
  'Cochabamba, 12 de diciembre de 2019',
].join('\n');

describe('parseDocumentReading', () => {
  it('lee nombre, carrera y año impresos en un diploma de la UMSS', () => {
    expect(parseDocumentReading({ text: DIPLOMA, confidence: 0.92 }, DECLARED, 2026)).toEqual({
      isDiploma: true,
      documentKind: 'supported',
      confidence: 0.92,
      fullName: 'MARÍA QUISPE MAMANI',
      career: 'LICENCIATURA EN INGENIERÍA DE SISTEMAS',
      graduationYear: 2019,
    });
  });

  it('encuentra el nombre aunque esté partido en dos líneas', () => {
    const text = DIPLOMA.replace('MARÍA QUISPE MAMANI', 'MARÍA QUISPE\nMAMANI');
    expect(parseDocumentReading({ text, confidence: 0.9 }, DECLARED, 2026).fullName).toBe('MARÍA QUISPE MAMANI');
  });

  it('no inventa datos: si el documento dice otro nombre, no devuelve el declarado', () => {
    const text = DIPLOMA.replace('MARÍA QUISPE MAMANI', 'JUAN PÉREZ ROJAS');
    expect(parseDocumentReading({ text, confidence: 0.9 }, DECLARED, 2026).fullName).not.toBe('MARÍA QUISPE MAMANI');
  });

  it('marca como no diploma un documento sin las palabras de un diploma de la UMSS', () => {
    const reading = parseDocumentReading({ text: 'Factura de luz\nMaría Quispe Mamani\n2019', confidence: 0.9 }, DECLARED, 2026);
    expect(reading.isDiploma).toBe(false);
  });

  it('ignora años anteriores a 1950 y años futuros', () => {
    const text = `${DIPLOMA.replace('2019', '2031')}\nResolución 1890`;
    expect(parseDocumentReading({ text, confidence: 0.9 }, DECLARED, 2026).graduationYear).toBeNull();
  });

  it('limita la confianza entre 0 y 1', () => {
    expect(parseDocumentReading({ text: DIPLOMA, confidence: 1.4 }, DECLARED, 2026).confidence).toBe(1);
  });
});


describe('regresiones del año leído', () => {
  it('no toma el año de una resolución como año de titulación', () => {
    const text = DIPLOMA.replace('2019', '2020') + '\nResolución 2019';
    const reading = parseDocumentReading({ text, confidence: 0.95 }, DECLARED, 2026);
    expect(reading.graduationYear).toBe(2020);
  });

  it('no elige el año declarado cuando hay dos fechas posibles', () => {
    const text = DIPLOMA + '\nFecha de expedición: 12/12/2020';
    expect(parseDocumentReading({ text, confidence: 0.95 }, DECLARED, 2026).graduationYear).toBeNull();
  });
});

describe('extracción independiente y conservadora', () => {
  it('no cambia ningún campo leído cuando cambia lo declarado', () => {
    const document = { text: DIPLOMA, confidence: 0.95 };
    const original = parseDocumentReading(document, DECLARED, 2026);
    const changed = parseDocumentReading(document, { firstName: 'Pedro', lastName: 'López', career: 'Ingeniería Informática', graduationYear: 2024 }, 2026);
    expect(changed).toEqual(original);
  });
  it('conserva el nombre diferente que realmente aparece', () => {
    const text = DIPLOMA.replace('MARÍA QUISPE MAMANI', 'JUAN PÉREZ ROJAS');
    expect(parseDocumentReading({ text, confidence: 0.9 }, DECLARED, 2026).fullName).toBe('JUAN PÉREZ ROJAS');
  });
  it('no asigna un nombre sin contexto de destinatario', () => {
    const text = DIPLOMA.replace('Se confiere a', 'Firmado por');
    expect(parseDocumentReading({ text, confidence: 0.9 }, DECLARED, 2026).fullName).toBeNull();
  });
  it('detecta destinatario en la misma línea y nombre en orden de apellidos', () => {
    const text = DIPLOMA.replace('Se confiere a\nMARÍA QUISPE MAMANI', 'A: QUISPE MAMANI MARÍA');
    expect(parseDocumentReading({ text, confidence: 0.9 }, DECLARED, 2026).fullName).toBe('QUISPE MAMANI MARÍA');
  });
  it('no elige entre dos destinatarios diferentes', () => {
    const text = DIPLOMA + '\nNombre: JUAN PÉREZ ROJAS';
    expect(parseDocumentReading({ text, confidence: 0.9 }, DECLARED, 2026).fullName).toBeNull();
  });
  it('conserva la variante de carrera realmente leída', () => {
    const text = DIPLOMA.replace('LICENCIATURA EN INGENIERÍA DE SISTEMAS', 'ING. DE SISTEMAS');
    expect(parseDocumentReading({ text, confidence: 0.9 }, DECLARED, 2026).career).toBe('ING. DE SISTEMAS');
  });
  it('no inventa carrera cuando hay dos carreras diferentes', () => {
    const text = DIPLOMA + '\nIngeniería Informática';
    expect(parseDocumentReading({ text, confidence: 0.9 }, DECLARED, 2026).career).toBeNull();
  });
  it('clasifica un curso como no admitido y un certificado ambiguo como desconocido', () => {
    expect(parseDocumentReading({ text: 'UMSA\nCERTIFICADO\nCurso de extensión', confidence: 0.9 }, DECLARED, 2026).documentKind).toBe('unsupported');
    expect(parseDocumentReading({ text: 'CERTIFICADO DE TITULACIÓN', confidence: 0.9 }, DECLARED, 2026).documentKind).toBe('unknown');
  });
  it('la confianza del encabezado no oculta un nombre poco legible', () => {
    const document = { text: DIPLOMA, confidence: 0.98, regions: [{ text: 'MARÍA QUISPE MAMANI', confidence: 0.3 }] };
    expect(parseDocumentReading(document, DECLARED, 2026).confidence).toBe(0.3);
  });
  it('trata confianza no finita como lectura no confiable', () => {
    expect(parseDocumentReading({ text: DIPLOMA, confidence: NaN }, DECLARED, 2026).confidence).toBe(0);
  });
});
