import { MailTemplateService } from '../../mail/services/mail-template.service.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';
import {
  surveyClosedNotification,
  surveyClosingSoonNotification,
  surveyReminderNotification,
  surveyVariationAlertNotification,
} from '../notification/survey-notifications.js';

const CONTEXT = {
  recipientName: 'Ana Rojas',
  actionUrl: 'http://localhost:3000/surveys/survey-1',
};

describe('survey notifications', () => {
  it('valida el recordatorio y renderiza su correo con la plantilla del dominio', async () => {
    const notification = surveyReminderNotification({
      surveyTitle: ' Empleabilidad ',
      closesAtFormatted: '30/11/2026 20:00.',
    });

    expect(notification.type).toBe(NotificationType.SURVEY_REMINDER);
    expect(notification.payload).toEqual({
      surveyTitle: 'Empleabilidad',
      closesAtFormatted: '30/11/2026 20:00.',
    });
    const mail = await notification.renderMail!(CONTEXT);
    expect(mail.mjml).toContain('Recordatorio de encuesta');
    expect(mail).toMatchObject({
      subject: 'Recordatorio: responde la encuesta «Empleabilidad»',
      text: 'Hola Ana Rojas, aún no respondiste la encuesta «Empleabilidad». Cierra el: 30/11/2026 20:00. Responde en: http://localhost:3000/surveys/survey-1',
      values: {
        recipientName: 'Ana Rojas',
        surveyTitle: 'Empleabilidad',
        closesAtFormatted: '30/11/2026 20:00.',
        actionUrl: 'http://localhost:3000/surveys/survey-1',
      },
    });
  });

  it('usa el nombre genérico cuando el destinatario no tiene nombre', async () => {
    const mail = await surveyClosedNotification({
      surveyTitle: 'Empleabilidad',
      closesAtFormatted: '30/11/2026 20:00.',
      responsesCount: 3,
    }).renderMail!({ ...CONTEXT, recipientName: '' });

    expect(mail.values).toMatchObject({ recipientName: 'Administrador', responsesCount: '3' });
  });

  it('renderiza las plantillas MJML del dominio con sus valores', async () => {
    const mails = await Promise.all([
      surveyReminderNotification({ surveyTitle: 'Encuesta', closesAtFormatted: 'Hoy.' }),
      surveyClosingSoonNotification({ surveyTitle: 'Encuesta', closesAtFormatted: 'Hoy.', responsesCount: 0 }),
      surveyClosedNotification({ surveyTitle: 'Encuesta', closesAtFormatted: 'Hoy.', responsesCount: 0 }),
      surveyVariationAlertNotification({ surveyTitle: 'Encuesta', threshold: 10, summaryText: 'Cambio' }),
    ].map((notification) => notification.renderMail!(CONTEXT)));

    const templates = new MailTemplateService();
    const html = await Promise.all(
      mails.map((mail) => templates.render(mail.mjml, { ...mail.values, brandName: 'UMSSY', logoUrl: '' })),
    );
    html.forEach((rendered) => expect(rendered).toContain('Encuesta'));
  });

  it.each([
    ['un título vacío', () => surveyReminderNotification({ surveyTitle: '  ', closesAtFormatted: 'Hoy.' })],
    ['una fecha de cierre vacía', () => surveyClosedNotification({ surveyTitle: 'Encuesta', closesAtFormatted: '', responsesCount: 1 })],
    ['un conteo negativo', () => surveyClosingSoonNotification({ surveyTitle: 'Encuesta', closesAtFormatted: 'Hoy.', responsesCount: -1 })],
    ['un umbral fuera de rango', () => surveyVariationAlertNotification({ surveyTitle: 'Encuesta', threshold: 0, summaryText: 'Cambio' })],
    ['un resumen vacío', () => surveyVariationAlertNotification({ surveyTitle: 'Encuesta', threshold: 10, summaryText: '' })],
  ])('rechaza %s antes de notificar', (_, build) => {
    expect(build).toThrow();
  });
});
