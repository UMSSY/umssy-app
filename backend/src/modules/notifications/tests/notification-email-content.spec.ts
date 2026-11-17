import { Logger } from '@nestjs/common';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NOTIFICATION_TEMPLATES } from '../constants/notification-templates.constants.js';
import { MailDispatcherService } from '../services/mail-dispatcher.service.js';
import { NotificationsService } from '../services/notifications.service.js';
import { NotificationType } from '../types/notification-type.enum.js';

const chatTemplate = NOTIFICATION_TEMPLATES[NotificationType.CHAT_MESSAGE];
const chatPayload = { senderName: 'Ana', previewText: 'Hola', messageCount: 1 };
const emailContent = {
  template: 'account-activated' as const,
  subject: 'Asunto propio',
  text: 'Texto propio',
  values: { firstName: 'Ana', loginUrl: 'https://umssy.test/login' },
};

describe('Correo propio de un tipo de notificación', () => {
  describe('NotificationsService', () => {
    const mailDispatch = vi.fn();
    const pushDispatch = vi.fn();
    const createMany = vi.fn();
    const findManyByUserIds = vi.fn();
    let service: NotificationsService;

    beforeAll(() => {
      Logger.overrideLogger(false);
    });

    beforeEach(() => {
      vi.resetAllMocks();
      mailDispatch.mockResolvedValue('sent');
      pushDispatch.mockResolvedValue('sent');
      createMany.mockResolvedValue([{ id: 'notification-1', recipientId: 'user-2' }]);
      findManyByUserIds.mockResolvedValue([
        { userId: 'user-2', pushEnabled: true, emailEnabled: true },
      ]);
      service = new NotificationsService(
        {
          findTypeByCode: vi.fn().mockResolvedValue({
            id: 'type-1',
            code: NotificationType.CHAT_MESSAGE,
            sendsPush: true,
            sendsEmail: true,
          }),
          createMany,
        } as never,
        { findManyByUserIds } as never,
        { hasBlockBetween: vi.fn().mockResolvedValue(false) } as never,
        { dispatchToUsers: pushDispatch } as never,
        { dispatchToUsers: mailDispatch } as never,
        { emitToUser: vi.fn() } as never,
        { isVisible: vi.fn().mockReturnValue(false) } as never,
      );
      vi.stubEnv('FRONTEND_URL', 'https://umssy.test');
    });

    afterEach(() => {
      delete chatTemplate.renderEmail;
      vi.unstubAllEnvs();
    });

    const notifyChat = () =>
      service.notify({
        recipientIds: ['user-2'],
        type: NotificationType.CHAT_MESSAGE,
        payload: chatPayload,
        actionUrl: '/chat',
      });

    it('mantiene el correo genérico cuando el tipo no define uno propio', async () => {
      await notifyChat();

      expect(mailDispatch).toHaveBeenCalledExactlyOnceWith(
        ['user-2'],
        'Mensaje nuevo de: Ana',
        'Hola',
        '/chat',
        undefined,
      );
    });

    it('pasa al correo el contenido propio con el enlace absoluto del frontend', async () => {
      const renderEmail = vi.fn().mockReturnValue(emailContent);
      chatTemplate.renderEmail = renderEmail;

      await notifyChat();

      expect(renderEmail).toHaveBeenCalledExactlyOnceWith(
        chatPayload,
        'https://umssy.test/chat',
      );
      expect(mailDispatch).toHaveBeenCalledExactlyOnceWith(
        ['user-2'],
        'Mensaje nuevo de: Ana',
        'Hola',
        '/chat',
        emailContent,
      );
      expect(createMany).toHaveBeenCalledWith([
        expect.objectContaining({ link: '/chat' }),
      ]);
    });

    it('no arma el correo propio si la persona desactivó los correos', async () => {
      const renderEmail = vi.fn().mockReturnValue(emailContent);
      chatTemplate.renderEmail = renderEmail;
      findManyByUserIds.mockResolvedValue([
        { userId: 'user-2', pushEnabled: true, emailEnabled: false },
      ]);

      const result = await notifyChat();

      expect(renderEmail).not.toHaveBeenCalled();
      expect(mailDispatch).not.toHaveBeenCalled();
      expect(result.emailStatus).toBe('skipped');
    });

    it('marca solo el correo como fallido si no se puede armar su contenido', async () => {
      chatTemplate.renderEmail = () => {
        throw new Error('Plantilla inválida');
      };

      const result = await notifyChat();

      expect(result).toEqual({
        inAppCount: 1,
        pushStatus: 'sent',
        emailStatus: 'failed',
      });
      expect(mailDispatch).not.toHaveBeenCalled();
    });
  });

  describe('MailDispatcherService', () => {
    const send = vi.fn();
    let dispatcher: MailDispatcherService;

    beforeEach(() => {
      vi.resetAllMocks();
      send.mockResolvedValue(undefined);
      dispatcher = new MailDispatcherService(
        { send } as never,
        {
          findEmailByUserId: vi.fn().mockResolvedValue('ana@umssy.test'),
        } as never,
      );
    });

    it('usa la plantilla genérica con título, cuerpo y enlace si no hay contenido propio', async () => {
      await dispatcher.dispatchToUsers(['user-1'], 'Título', 'Cuerpo', '/ruta');

      const [[message]] = send.mock.calls as [[Record<string, unknown>]];
      expect(message).toMatchObject({
        to: 'ana@umssy.test',
        subject: 'Título',
        text: 'Cuerpo',
        values: { title: 'Título', body: 'Cuerpo', actionUrl: '/ruta' },
      });
      expect(message.mjml).toContain('{{ title }}');
    });

    it('usa la plantilla, el asunto, el texto y los valores del contenido propio', async () => {
      const result = await dispatcher.dispatchToUsers(
        ['user-1'],
        'Título',
        'Cuerpo',
        '/ruta',
        emailContent,
      );

      const [[message]] = send.mock.calls as [[Record<string, unknown>]];
      expect(message).toMatchObject({
        subject: 'Asunto propio',
        text: 'Texto propio',
        values: emailContent.values,
      });
      expect(message.mjml).not.toContain('{{ title }}');
      expect(message.mjml).toContain('{{ loginUrl }}');
      expect(result).toBe('sent');
    });
  });
});
