import { Test, TestingModule } from '@nestjs/testing';
import { MailDispatcherService } from '../services/mail-dispatcher.service.js';
import { MailService } from '../../mail/services/mail.service.js';
import { NotificationUserLookupRepository } from '../repositories/notification-user-lookup.repository.js';

vi.mock('../../mail/helpers/load-mail-template.js', () => ({
  loadMailTemplate: vi.fn((name: string) => Promise.resolve(`<mjml>${name}</mjml>`)),
}));

const contact = (email: string) => ({ id: 'user', email, firstName: 'Ana', lastName: 'Rojas' });

describe('MailDispatcherService', () => {
  let service: MailDispatcherService;
  let mockMailService: any;
  let mockUserLookup: any;

  beforeEach(async () => {
    mockMailService = { send: vi.fn().mockResolvedValue(undefined) };
    mockUserLookup = { findContactByUserId: vi.fn().mockResolvedValue(contact('test@umssy.com')) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailDispatcherService,
        { provide: MailService, useValue: mockMailService },
        { provide: NotificationUserLookupRepository, useValue: mockUserLookup },
      ],
    }).compile();

    service = module.get<MailDispatcherService>(MailDispatcherService);
  });

  it('debe enviar correos solo a los usuarios con email válido', async () => {
    mockUserLookup.findContactByUserId
      .mockResolvedValueOnce(contact('user1@umssy.com'))
      .mockResolvedValueOnce(null);

    const result = await service.dispatchToUsers(['user-1', 'user-2'], 'Title', 'Body', '/url');

    expect(mockMailService.send).toHaveBeenCalledTimes(1);
    expect(mockMailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user1@umssy.com',
        subject: 'Title',
        mjml: '<mjml>notification</mjml>',
      })
    );
    expect(result).toEqual({
      status: 'sent',
      deliveries: [
        { recipientId: 'user-1', channel: 'email', status: 'sent' },
        { recipientId: 'user-2', channel: 'email', status: 'skipped' },
      ],
    });
  });

  it('debe manejar fallos en el envío sin romper el flujo', async () => {
    mockMailService.send.mockRejectedValue(new Error('SMTP Down'));

    const result = await service.dispatchToUsers(['user-1'], 'Title', 'Body', '/url');

    expect(result).toEqual({
      status: 'failed',
      deliveries: [{ recipientId: 'user-1', channel: 'email', status: 'failed' }],
    });
  });

  it('usa la plantilla propia del tipo con el nombre del destinatario', async () => {
    const renderMail = vi.fn(async ({ recipientName, actionUrl }) => ({
      mjml: '<mjml>survey-reminder</mjml>',
      subject: 'Recordatorio',
      text: `Hola ${recipientName}`,
      values: { recipientName, actionUrl },
    }));

    const result = await service.dispatchToUsers(['user-1'], 'Title', 'Body', '/url', renderMail);

    expect(renderMail).toHaveBeenCalledWith({ recipientName: 'Ana Rojas', actionUrl: '/url' });
    expect(mockMailService.send).toHaveBeenCalledWith({
      to: 'test@umssy.com',
      subject: 'Recordatorio',
      text: 'Hola Ana Rojas',
      mjml: '<mjml>survey-reminder</mjml>',
      values: { recipientName: 'Ana Rojas', actionUrl: '/url' },
    });
    expect(result.status).toBe('sent');
  });
});