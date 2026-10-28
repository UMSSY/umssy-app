import { describe, expect, it } from 'vitest';
import { SurveyPdfService } from '../services/survey-pdf.service.js';
import type { SurveyStatisticsResponse } from '../responses/survey-statistics.response.js';

describe('SurveyPdfService', () => {
  const service = new SurveyPdfService();

  const mockStatistics: SurveyStatisticsResponse = {
    id: '162d32dc-17f4-487c-a0bf-f9aa1607d082',
    title: 'Inserción Laboral Temprana de Titulados en Informática',
    description: 'Estudio de inserción',
    status: 'published',
    academicPeriod: 'II-2025',
    career: { id: 'c1', title: 'Licenciatura en Informática' },
    opensAt: '2026-08-19T00:00:00.000Z',
    closesAt: '2027-01-31T00:00:00.000Z',
    totalResponses: 99,
    questions: [
      {
        id: 'q1',
        position: 1,
        statement: '¿En qué área tecnológica obtuviste tu primer puesto?',
        type: 'SINGLE_CHOICE',
        isRequired: true,
        answeredCount: 99,
        totalSelections: 99,
        options: [
          { id: 'o1', label: 'Desarrollo de Software', count: 19, percentage: 19.2 },
          { id: 'o2', label: 'Administración de Redes', count: 28, percentage: 28.3 },
          { id: 'o3', label: 'Ciencia de Datos', count: 13, percentage: 13.1 },
        ],
      },
      {
        id: 'q2',
        position: 2,
        statement: '¿Cuánto tiempo tardaste en colocarte profesionalmente?',
        type: 'SINGLE_CHOICE',
        isRequired: true,
        answeredCount: 99,
        totalSelections: 99,
        options: [
          { id: 'o4', label: 'Menos de 3 meses', count: 19, percentage: 19.2 },
          { id: 'o5', label: 'De 3 a 6 meses', count: 20, percentage: 20.2 },
        ],
      },
    ],
  };

  it('genera un buffer PDF válido con cabecera %PDF-', async () => {
    const buffer = await service.generatePdf(mockStatistics);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('maneja encuestas sin respuestas o preguntas sin lanzar excepciones', async () => {
    const emptyStats: SurveyStatisticsResponse = {
      ...mockStatistics,
      totalResponses: 0,
      career: null,
      academicPeriod: null,
      opensAt: null,
      closesAt: null,
      questions: [],
    };

    const buffer = await service.generatePdf(emptyStats);
    expect(buffer.length).toBeGreaterThan(500);
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('genera un número compacto de páginas para una encuesta de 6 preguntas', async () => {
    const sixQuestions = Array.from({ length: 6 }).map((_, i) => ({
      id: `q${i}`,
      position: i + 1,
      statement: `Pregunta número ${i + 1} sobre inserción y aspectos laborales del graduado`,
      type: 'SINGLE_CHOICE',
      isRequired: true,
      answeredCount: 99,
      totalSelections: 99,
      options: [
        { id: `o${i}_1`, label: 'Opción 1 - Desarrollo de Software y Aplicaciones', count: 40, percentage: 40.4 },
        { id: `o${i}_2`, label: 'Opción 2 - Redes y Administración de Sistemas', count: 35, percentage: 35.4 },
        { id: `o${i}_3`, label: 'Opción 3 - Soporte Técnico y Mantenimiento', count: 24, percentage: 24.2 },
      ],
    }));

    const stats = { ...mockStatistics, questions: sixQuestions };
    const buffer = await service.generatePdf(stats);

    const pdfText = buffer.toString('binary');
    const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
    expect(pageMatches?.length).toBeGreaterThanOrEqual(1);
    expect(pageMatches?.length).toBeLessThanOrEqual(3);
  });

  it('soporta tanto tipos lowercase (single_choice) como multiple_choice sin errores', async () => {
    const statsWithMixedTypes: SurveyStatisticsResponse = {
      ...mockStatistics,
      questions: [
        {
          id: 'q1',
          position: 1,
          statement: 'Pregunta de opción única',
          type: 'single_choice',
          isRequired: true,
          answeredCount: 50,
          totalSelections: 50,
          options: [{ id: 'o1', label: 'Opción 1', count: 50, percentage: 100 }],
        },
        {
          id: 'q2',
          position: 2,
          statement: 'Pregunta de opción múltiple',
          type: 'multiple_choice',
          isRequired: true,
          answeredCount: 80,
          totalSelections: 120,
          options: [{ id: 'o2', label: 'Opción A', count: 80, percentage: 66.7 }],
        },
      ],
    };

    const buffer = await service.generatePdf(statsWithMixedTypes);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });
});
