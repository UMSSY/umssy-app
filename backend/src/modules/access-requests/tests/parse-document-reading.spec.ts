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
      confidence: 0.92,
      fullName: 'maria quispe mamani',
      career: 'licenciatura en ingenieria de sistemas',
      graduationYear: 2019,
    });
  });

  it('encuentra el nombre aunque esté partido en dos líneas', () => {
    const text = DIPLOMA.replace('MARÍA QUISPE MAMANI', 'MARÍA QUISPE\nMAMANI');
    expect(parseDocumentReading({ text, confidence: 0.9 }, DECLARED, 2026).fullName).toBe('maria quispe mamani');
  });

  it('no inventa datos: si el documento dice otro nombre, no devuelve el declarado', () => {
    const text = DIPLOMA.replace('MARÍA QUISPE MAMANI', 'JUAN PÉREZ ROJAS');
    expect(parseDocumentReading({ text, confidence: 0.9 }, DECLARED, 2026).fullName).not.toBe('maria quispe mamani');
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
