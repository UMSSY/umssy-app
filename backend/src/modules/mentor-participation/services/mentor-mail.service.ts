import { Injectable } from '@nestjs/common';
import { MailService } from '../../mail/services/mail.service.js';

const SUBJECTS: Record<string, string> = {
  WAITING: 'Solicitud de cupo recibida',
  OFFERED: 'Tienes un cupo disponible para mentoría',
  ACTIVE: 'Tu participación como mentor está activa',
  EXPIRED: 'Tu oferta de cupo venció',
  CANCELLED: 'Tu solicitud de cupo fue cancelada',
  SANCTION: 'Suspensión temporal de solicitudes de mentoría',
};

@Injectable()
export class MentorMailService {
  constructor(private readonly mail: MailService) {}

  async send(event: { eventKey: string; recipient: string; type: string; payload?: unknown }): Promise<void> {
    const appOrigin = process.env.CORS_ORIGIN?.split(',')[0] ?? 'http://localhost:3000';
    const subject = SUBJECTS[event.type] ?? 'Actualización de mentorías';
    const sanctionPayload = event.payload as { startsAt?: string; expiresAt?: string } | undefined;
    const boliviaTime = (value: string) => new Intl.DateTimeFormat('es-BO', {
      timeZone: 'America/La_Paz', dateStyle: 'full', timeStyle: 'short',
    }).format(new Date(value));
    const sanctionStartsAt = sanctionPayload?.startsAt ? boliviaTime(sanctionPayload.startsAt) : 'el momento de esta notificación';
    const sanctionEndsAt = sanctionPayload?.expiresAt ? boliviaTime(sanctionPayload.expiresAt) : '72 horas desde la suspensión';
    const body = event.type === 'SANCTION'
      ? `Registramos cinco intentos distintos de solicitar participación como mentor en 24 horas. La suspensión comenzó el ${sanctionStartsAt} y termina el ${sanctionEndsAt} (hora de Bolivia). Cuando termine, podrás volver al formulario de participación; se validará nuevamente el cupo del 40% y, si no hay disponibilidad, tu nueva solicitud ingresará al final de la lista FIFO. Tus solicitudes y ofertas existentes pueden consultarse mientras tanto. Si necesitas ayuda, contacta a la administración institucional.`
      : event.type === 'EXPIRED'
      ? 'El plazo venció. Tu solicitud quedó cerrada. Para volver a participar, crea una solicitud nueva.'
      : event.type === 'OFFERED'
        ? 'Se te reservó un cupo durante 24 horas desde la asignación. Ingresa a la plataforma y confirma antes del vencimiento.'
        : event.type === 'WAITING'
          ? 'Recibimos tu solicitud y te avisaremos cuando tengas un cupo disponible.'
          : event.type === 'CANCELLED'
            ? 'Tu solicitud fue cancelada. Si vuelves a solicitar, ingresarás al final de la cola.'
            : 'Tu participación como mentor ya está activa.';
    const appUrl = `${appOrigin}/mentors/participation`;
    await this.mail.send({
      to: event.recipient,
      subject,
      text: `${body}\n\nAbre ${appUrl} e inicia sesión.`,
      mjml: '<mj-section><mj-column><mj-text>{{message}}</mj-text><mj-button href="{{appUrl}}">Ver mi participación</mj-button></mj-column></mj-section>',
      values: { message: body, appUrl },
    });
  }
}
