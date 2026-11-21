import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { MailTemplateService } from '../../mail/services/mail-template.service.js';
import { NOTIFICATION_TEMPLATES } from '../../notifications/constants/notification-templates.constants.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';
import { AppointmentParticipantRole } from '../enums/appointment-participant-role.enum.js';
import {
  APPOINTMENT_BOOKED_TEMPLATE,
  renderAppointmentBookedMail,
} from '../notification/appointment-booked.template.js';

const payloadFor = (
  recipientRole: AppointmentParticipantRole,
  counterpartName: string,
) => ({
  counterpartName,
  date: '23/10/2026',
  time: '10:00',
  topic: 'Orientación profesional',
  recipientRole,
});

describe('Plantilla del aviso «Nueva cita reservada»', () => {
  it('es la plantilla que usa la plataforma para APPOINTMENT_BOOKED', () => {
    expect(NOTIFICATION_TEMPLATES[NotificationType.APPOINTMENT_BOOKED]).toBe(
      APPOINTMENT_BOOKED_TEMPLATE,
    );
  });

  it('usa el título «Nueva cita reservada» para los dos roles', () => {
    for (const role of Object.values(AppointmentParticipantRole)) {
      expect(
        APPOINTMENT_BOOKED_TEMPLATE.renderTitle(payloadFor(role, 'Ana Pérez')),
      ).toBe('Nueva cita reservada');
    }
  });

  it('le dice al mentor qué titulado reservó, con la fecha y la hora', () => {
    expect(
      APPOINTMENT_BOOKED_TEMPLATE.renderBody(
        payloadFor(AppointmentParticipantRole.MENTOR, 'Luis Flores'),
      ),
    ).toBe(
      'Luis Flores reservó una cita contigo para el 23/10/2026 a las 10:00.',
    );
  });

  it('le confirma al titulado la cita con su mentor, con la fecha y la hora', () => {
    expect(
      APPOINTMENT_BOOKED_TEMPLATE.renderBody(
        payloadFor(AppointmentParticipantRole.STUDENT, 'Ana Pérez'),
      ),
    ).toBe(
      'Tu cita con Ana Pérez quedó confirmada para el 23/10/2026 a las 10:00.',
    );
  });

  it.each(Object.values(AppointmentParticipantRole))(
    'acorta solo el nombre largo para no superar 100 caracteres (%s)',
    (role) => {
      const body = APPOINTMENT_BOOKED_TEMPLATE.renderBody(
        payloadFor(
          role,
          'María Fernanda de los Ángeles Gutiérrez Villarroel Montaño',
        ),
      );

      expect(body.length).toBeLessThanOrEqual(100);
      expect(body).toContain('...');
      expect(body).toContain('23/10/2026 a las 10:00.');
    },
  );

  it.each(Object.values(AppointmentParticipantRole))(
    'no parte un emoji al acortar el nombre (%s)',
    (role) => {
      for (const prefix of ['José ', 'Anas ']) {
        const body = APPOINTMENT_BOOKED_TEMPLATE.renderBody(
          payloadFor(role, `${prefix}${'🎓'.repeat(40)}`),
        );

        expect(body.length).toBeLessThanOrEqual(100);
        expect(body).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
        expect(body).toContain('23/10/2026 a las 10:00.');
      }
    },
  );

  it('no incluye el tema en el texto corto del aviso', () => {
    const body = APPOINTMENT_BOOKED_TEMPLATE.renderBody(
      payloadFor(AppointmentParticipantRole.MENTOR, 'Luis Flores'),
    );

    expect(body).not.toContain('Orientación profesional');
  });

  describe('correo «Cita confirmada»', () => {
    const actionUrl = 'https://umssy.test/appointments';
    const emailFor = (role: AppointmentParticipantRole, name: string) =>
      renderAppointmentBookedMail(payloadFor(role, name), {
        recipientName: '',
        actionUrl: '/appointments',
      });

    beforeAll(() => {
      vi.stubEnv('FRONTEND_URL', 'https://umssy.test');
    });

    afterAll(() => {
      vi.unstubAllEnvs();
    });

    it('usa la plantilla propia y el asunto «Cita confirmada»', async () => {
      const email = await emailFor(
        AppointmentParticipantRole.MENTOR,
        'Luis Flores',
      );

      expect(email.mjml).toContain('Cita confirmada');
      expect(email.subject).toBe('Cita confirmada');
    });

    it('le presenta al mentor el titulado con la fecha, la hora GMT-4 y el tema', async () => {
      const email = await emailFor(
        AppointmentParticipantRole.MENTOR,
        'Luis Flores',
      );

      expect(email.values).toEqual({
        intro: 'Luis Flores reservó una cita de orientación contigo.',
        counterpartLabel: 'Titulado',
        counterpartName: 'Luis Flores',
        date: '23/10/2026',
        time: '10:00 (hora de Bolivia, GMT-4)',
        topic: 'Orientación profesional',
        actionUrl,
      });
    });

    it('muestra «Tema no especificado» si la cita no tiene tema', async () => {
      const email = await renderAppointmentBookedMail(
        {
          ...payloadFor(AppointmentParticipantRole.MENTOR, 'Luis Flores'),
          topic: '',
        },
        { recipientName: '', actionUrl: '/appointments' },
      );

      expect(email.values.topic).toBe('Tema no especificado');
      expect(email.text).toContain('Tema: Tema no especificado');
    });

    it('le presenta al titulado su mentor', async () => {
      const email = await emailFor(
        AppointmentParticipantRole.STUDENT,
        'Ana Pérez',
      );

      expect(email.values).toMatchObject({
        intro: 'Tu cita de orientación con Ana Pérez quedó confirmada.',
        counterpartLabel: 'Mentor',
        counterpartName: 'Ana Pérez',
      });
    });

    it('incluye los mismos datos en la versión de texto plano', async () => {
      const email = await emailFor(
        AppointmentParticipantRole.STUDENT,
        'Ana Pérez',
      );

      expect(email.text.split('\n')).toEqual([
        'Tu cita de orientación con Ana Pérez quedó confirmada.',
        'Mentor: Ana Pérez',
        'Fecha: 23/10/2026',
        'Hora: 10:00 (hora de Bolivia, GMT-4)',
        'Tema: Orientación profesional',
        `Ver mis citas: ${actionUrl}`,
      ]);
    });

    it('se arma sobre el layout institucional con todos los datos y escapa el nombre', async () => {
      const email = await emailFor(
        AppointmentParticipantRole.MENTOR,
        'Luis <b>Flores</b>',
      );
      const html = await new MailTemplateService().render(email.mjml, {
        ...email.values,
        brandName: 'UMSSY',
        logoUrl: '',
      });

      expect(html).toContain('Cita confirmada');
      expect(html).toContain('23/10/2026');
      expect(html).toContain('10:00 (hora de Bolivia, GMT-4)');
      expect(html).toContain('Orientación profesional');
      expect(html).toContain(`href="${actionUrl}"`);
      expect(html).toContain('Ver mis citas');
      expect(html).toContain('Este es un mensaje automático.');
      expect(html).toContain('Luis &lt;b&gt;Flores&lt;/b&gt;');
      expect(html).not.toContain('<b>Flores</b>');
    });
  });
});
