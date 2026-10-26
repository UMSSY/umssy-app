import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MailService } from '../../mail/services/mail.service.js';
import { MentorMailService } from '../services/mentor-mail.service.js';

afterEach(() => vi.unstubAllEnvs());

describe('notificaciones HU7 con el correo compartido', () => {
  it('envía la oferta con el enlace de participación mediante MailService', async () => {
    vi.stubEnv('CORS_ORIGIN', 'https://umssy.example.com');
    const send = vi.fn().mockResolvedValue(undefined);
    const service = new MentorMailService({ send } as unknown as MailService);

    await service.send({ eventKey: 'request-1:OFFERED', recipient: 'ana@example.com', type: 'OFFERED' });

    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      to: 'ana@example.com',
      subject: 'Tienes un cupo disponible para mentoría',
      text: expect.stringContaining('24 horas'),
      values: {
        message: expect.stringContaining('24 horas'),
        appUrl: 'https://umssy.example.com/mentors/participation',
      },
    }));
  });

  it('propaga el fallo del transporte para que el outbox pueda reintentar', async () => {
    const send = vi.fn().mockRejectedValue(new Error('SMTP unavailable'));
    const service = new MentorMailService({ send } as unknown as MailService);

    await expect(service.send({
      eventKey: 'request-1:WAITING', recipient: 'ana@example.com', type: 'WAITING',
    })).rejects.toThrow('SMTP unavailable');
  });
});
