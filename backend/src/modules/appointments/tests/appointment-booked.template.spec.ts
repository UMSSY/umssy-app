import { describe, expect, it } from 'vitest';
import { NOTIFICATION_TEMPLATES } from '../../notifications/constants/notification-templates.constants.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';
import { AppointmentParticipantRole } from '../enums/appointment-participant-role.enum.js';
import { APPOINTMENT_BOOKED_TEMPLATE } from '../notifications/appointment-booked.template.js';

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
    ).toBe('Luis Flores reservó una cita contigo para el 23/10/2026 a las 10:00.');
  });

  it('le confirma al titulado la cita con su mentor, con la fecha y la hora', () => {
    expect(
      APPOINTMENT_BOOKED_TEMPLATE.renderBody(
        payloadFor(AppointmentParticipantRole.STUDENT, 'Ana Pérez'),
      ),
    ).toBe('Tu cita con Ana Pérez quedó confirmada para el 23/10/2026 a las 10:00.');
  });

  it.each(Object.values(AppointmentParticipantRole))(
    'acorta solo el nombre largo para no superar 100 caracteres (%s)',
    (role) => {
      const body = APPOINTMENT_BOOKED_TEMPLATE.renderBody(
        payloadFor(role, 'María Fernanda de los Ángeles Gutiérrez Villarroel Montaño'),
      );

      expect(body.length).toBeLessThanOrEqual(100);
      expect(body).toContain('...');
      expect(body).toContain('23/10/2026 a las 10:00.');
    },
  );

  it('no incluye el tema en el texto corto del aviso', () => {
    const body = APPOINTMENT_BOOKED_TEMPLATE.renderBody(
      payloadFor(AppointmentParticipantRole.MENTOR, 'Luis Flores'),
    );

    expect(body).not.toContain('Orientación profesional');
  });
});
