import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { MailTemplateService } from '../../mail/services/mail-template.service.js';
import { NOTIFICATION_TEMPLATES } from '../../notifications/constants/notification-templates.constants.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';
import {
  APPOINTMENT_CANCELLED_TEMPLATE,
  renderAppointmentCancelledMail,
} from '../notification/appointment-cancelled.template.js';

const ACTION_URL = 'https://umssy.test/appointments';

const payload = (reason?: string) => ({
  cancelledByName: 'Luis Flores',
  date: '23/10/2026',
  time: '10:00',
  ...(reason === undefined ? {} : { reason }),
});

const context = { recipientName: '', actionUrl: '/appointments' };

const emailFor = (reason?: string) =>
  renderAppointmentCancelledMail(payload(reason), context);

const render = async (reason?: string, cancelledByName?: string) => {
  const email = await renderAppointmentCancelledMail(
    { ...payload(reason), ...(cancelledByName ? { cancelledByName } : {}) },
    context,
  );
  return new MailTemplateService().render(email.mjml, {
    ...email.values,
    brandName: 'UMSSY',
    logoUrl: '',
  });
};

beforeAll(() => {
  vi.stubEnv('FRONTEND_URL', 'https://umssy.test');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe('Plantilla del aviso «Cita cancelada»', () => {
  it('es la plantilla que usa la plataforma para APPOINTMENT_CANCELLED', () => {
    expect(NOTIFICATION_TEMPLATES[NotificationType.APPOINTMENT_CANCELLED]).toBe(
      APPOINTMENT_CANCELLED_TEMPLATE,
    );
  });

  it('mantiene el título y el texto corto del aviso, sin el motivo', () => {
    const withReason = payload('Me surgió un viaje');

    expect(APPOINTMENT_CANCELLED_TEMPLATE.renderTitle(withReason)).toBe(
      'Cita cancelada',
    );
    const body = APPOINTMENT_CANCELLED_TEMPLATE.renderBody(withReason);
    expect(body).toBe(
      'Luis Flores canceló tu cita del 23/10/2026 a las 10:00.',
    );
    expect(body).not.toContain('Me surgió un viaje');
  });

  it('no supera 100 caracteres con nombres largos y conserva la fecha y la hora', () => {
    const body = APPOINTMENT_CANCELLED_TEMPLATE.renderBody({
      ...payload(),
      cancelledByName:
        'María Fernanda de los Ángeles Gutiérrez Villarroel de la Santísima Trinidad y Montaño',
    });

    expect(body.length).toBeLessThanOrEqual(100);
    expect(body).toMatch(
      /\.\.\. canceló tu cita del 23\/10\/2026 a las 10:00\.$/,
    );
  });

  it('no parte un emoji del nombre al acortar el texto', () => {
    const body = APPOINTMENT_CANCELLED_TEMPLATE.renderBody({
      ...payload(),
      cancelledByName: '😀'.repeat(60),
    });

    expect(body.length).toBeLessThanOrEqual(100);
    expect(body).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
    expect(body.endsWith('canceló tu cita del 23/10/2026 a las 10:00.')).toBe(
      true,
    );
  });

  describe('correo «Cita cancelada»', () => {
    it('indica quién canceló, la fecha y la hora GMT-4 con el enlace a mis citas', async () => {
      const email = await emailFor('Me surgió un viaje');

      expect(email.subject).toBe('Cita cancelada');
      expect(email.values).toEqual({
        intro:
          'Luis Flores canceló la cita de orientación que tenían agendada.',
        cancelledByName: 'Luis Flores',
        date: '23/10/2026',
        time: '10:00 (hora de Bolivia, GMT-4)',
        reason: 'Me surgió un viaje',
        actionUrl: ACTION_URL,
      });
    });

    it('incluye el motivo cuando lo hay, también en el texto plano', async () => {
      const email = await emailFor('  Me surgió un viaje  ');

      expect(email.mjml).toContain('{{ reason }}');
      expect(email.text.split('\n')).toEqual([
        'Luis Flores canceló la cita de orientación que tenían agendada.',
        'Canceló: Luis Flores',
        'Fecha: 23/10/2026',
        'Hora: 10:00 (hora de Bolivia, GMT-4)',
        'Motivo: Me surgió un viaje',
        `Ver mis citas: ${ACTION_URL}`,
      ]);
    });

    it.each([
      { label: 'sin motivo', reason: undefined },
      { label: 'con un motivo vacío', reason: '   ' },
    ])('no muestra la sección del motivo $label', async ({ reason }) => {
      const email = await emailFor(reason);

      expect(email.mjml).not.toContain('{{ reason }}');
      expect(email.values).not.toHaveProperty('reason');
      expect(email.text).not.toContain('Motivo');
    });

    it('se arma sobre el layout institucional con el motivo y escapa los datos', async () => {
      const html = await render('Viaje <b>urgente</b>', 'Luis <b>Flores</b>');

      expect(html).toContain('Cita cancelada');
      expect(html).toContain('23/10/2026');
      expect(html).toContain('10:00 (hora de Bolivia, GMT-4)');
      expect(html).toContain('Motivo');
      expect(html).toContain('Viaje &lt;b&gt;urgente&lt;/b&gt;');
      expect(html).toContain('Luis &lt;b&gt;Flores&lt;/b&gt;');
      expect(html).not.toContain('<b>');
      expect(html).toContain(`href="${ACTION_URL}"`);
      expect(html).toContain('Ver mis citas');
      expect(html).toContain('Este es un mensaje automático.');
    });

    it('se arma sin la sección del motivo cuando no lo hay', async () => {
      const html = await render();

      expect(html).toContain('Cita cancelada');
      expect(html).toContain('Luis Flores');
      expect(html).not.toContain('Motivo');
    });
  });
});
