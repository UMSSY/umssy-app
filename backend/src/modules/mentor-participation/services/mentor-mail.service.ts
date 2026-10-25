import { Injectable } from '@nestjs/common';
import { createConnection } from 'node:net';

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
  async send(event: { eventKey: string; recipient: string; type: string; payload?: unknown }): Promise<void> {
    if (process.env.MAIL_TRANSPORT !== 'mailpit') throw new Error('HU7 requiere MAIL_TRANSPORT=mailpit');
    const host = process.env.MAIL_HOST ?? 'localhost';
    const port = Number(process.env.MAIL_PORT ?? '1025');
    if (!['localhost', '127.0.0.1', '::1'].includes(host) || !Number.isInteger(port) || port < 1024 || port > 65535) {
      throw new Error('HU7 solo envía a Mailpit local');
    }
    const from = process.env.MAIL_FROM ?? 'hu7@umssy.test';
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
    const socket = createConnection({ host, port });
    socket.setTimeout(10_000);
    const connected = new Promise<void>((resolve, reject) => {
      socket.once('connect', resolve);
      socket.once('error', reject);
      socket.once('timeout', () => reject(new Error('SMTP no respondió')));
    });
    socket.on('error', () => undefined);
    let buffer = '';
    const lines: string[] = [];
    const waiting: Array<(line: string) => void> = [];
    socket.on('data', (chunk: Buffer) => {
      buffer += chunk.toString('utf8');
      while (buffer.includes('\n')) {
        const index = buffer.indexOf('\n');
        const line = buffer.slice(0, index).trimEnd();
        buffer = buffer.slice(index + 1);
        const listener = waiting.shift();
        if (listener) listener(line); else lines.push(line);
      }
    });
    const line = () => new Promise<string>((resolve, reject) => {
      if (lines.length) return resolve(lines.shift()!);
      const timer = setTimeout(() => reject(new Error('SMTP sin respuesta')), 10_000);
      waiting.push((value) => { clearTimeout(timer); resolve(value); });
    });
    const response = async (expected: number[]) => {
      let current = await line();
      while (/^\d{3}-/.test(current)) current = await line();
      const code = Number(current.slice(0, 3));
      if (!expected.includes(code)) throw new Error(`SMTP respondió ${code}`);
    };
    const command = async (value: string, expected: number[]) => {
      socket.write(`${value}\r\n`);
      await response(expected);
    };
    try {
      await connected;
      await response([220]);
      await command('EHLO localhost', [250]);
      await command(`MAIL FROM:<${from}>`, [250]);
      await command(`RCPT TO:<${event.recipient}>`, [250, 251]);
      await command('DATA', [354]);
      const message = [
        `From: ${from}`, `To: ${event.recipient}`, `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
        `Message-ID: <${event.eventKey.replace(/[^a-zA-Z0-9:.-]/g, '')}@umssy.test>`,
        'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', '',
        body, '', `Abre ${appOrigin}/mentors/participation e inicia sesión.`,
      ].join('\r\n').replace(/\r\n\./g, '\r\n..');
      await command(`${message}\r\n.`, [250]);
      socket.write('QUIT\r\n');
    } finally {
      socket.end();
    }
  }
}
