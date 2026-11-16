import { describe, expect, it } from 'vitest';

import {
  buildVariationShiftsMjml,
  type VariationShiftRow,
} from '../helpers/build-variation-shifts-mjml.js';
import { loadMailTemplate } from '../helpers/load-mail-template.js';
import { MailTemplateService } from '../services/mail-template.service.js';

function shift(overrides: Partial<VariationShiftRow> = {}): VariationShiftRow {
  return {
    questionStatement: '¿Trabaja en su área?',
    optionLabel: 'Sí',
    previousPercentage: 40,
    currentPercentage: 60,
    difference: 20,
    direction: 'up',
    ...overrides,
  };
}

describe('buildVariationShiftsMjml', () => {
  it('resalta la opción que subió en verde y la que bajó en rojo', () => {
    const html = buildVariationShiftsMjml([
      shift(),
      shift({
        optionLabel: 'No',
        previousPercentage: 60,
        currentPercentage: 40,
        difference: -20,
        direction: 'down',
      }),
    ]);

    expect(html).toContain('▲ +20 pp');
    expect(html).toContain('▼ -20 pp');
    expect(html).toContain('40% → 60%');
    expect(html).toContain('#0a7a3d');
    expect(html).toContain('#b42318');
  });

  it('agrupa las opciones bajo una sola vez cada pregunta', () => {
    const html = buildVariationShiftsMjml([
      shift({ optionLabel: 'Sí' }),
      shift({ optionLabel: 'No', direction: 'down', difference: -20 }),
      shift({ questionStatement: 'Otra pregunta' }),
    ]);

    expect(html.match(/¿Trabaja en su área\?/g)).toHaveLength(1);
    expect(html).toContain('Otra pregunta');
    expect(html.match(/<mj-table/g)).toHaveLength(2);
  });

  it('escapa el texto de las preguntas y opciones', () => {
    const html = buildVariationShiftsMjml([
      shift({
        questionStatement: '<b>{{ x }}</b>',
        optionLabel: 'A & "B"',
      }),
    ]);

    expect(html).not.toContain('<b>');
    expect(html).not.toContain('{{');
    expect(html).toContain('A &amp; &quot;B&quot;');
  });

  it('se integra en la plantilla real y genera un correo válido', async () => {
    const template = (await loadMailTemplate('survey-variation-alert')).replace(
      '[[shifts]]',
      () => buildVariationShiftsMjml([shift()]),
    );

    const html = await new MailTemplateService().render(template, {
      brandName: 'UMSSY',
      logoUrl: '',
      recipientName: 'Ana',
      surveyTitle: 'Encuesta de seguimiento',
      threshold: '10',
      periodsLabel: 'Comparación entre II-2025 y I-2026',
      actionUrl: 'http://localhost:3000/backoffice/surveys/statistics/1',
    });

    expect(html).toContain('Comparación entre II-2025 y I-2026');
    expect(html).toContain('▲ +20 pp');
    expect(html).toContain('Ver analíticas');
  });
});
