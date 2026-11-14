import { Test, TestingModule } from '@nestjs/testing';
import { MailDispatcherService } from '../services/mail-dispatcher.service.js';
import { MailService } from '../../mail/services/mail.service.js';
import { NotificationUserLookupRepository } from '../repositories/notification-user-lookup.repository.js';

describe('MailDispatcherService', () => {
  let service: MailDispatcherService;
  let mockMailService: any;
  let mockUserLookup: any;

  beforeEach(async () => {
    mockMailService = { send: vi.fn().mockResolvedValue(undefined) };
    mockUserLookup = { findEmailByUserId: vi.fn().mockResolvedValue('test@umssy.com') };

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
    mockUserLookup.findEmailByUserId
      .mockResolvedValueOnce('user1@umssy.com')
      .mockResolvedValueOnce(null);

    const result = await service.dispatchToUsers(['user-1', 'user-2'], 'Title', 'Body', '/url');

    expect(mockMailService.send).toHaveBeenCalledTimes(1);
    expect(mockMailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user1@umssy.com',
        subject: 'Title',
      })
    );
    expect(result).toBe('sent');
  });

  it('debe manejar fallos en el envío sin romper el flujo', async () => {
    mockMailService.send.mockRejectedValue(new Error('SMTP Down'));

    const result = await service.dispatchToUsers(['user-1'], 'Title', 'Body', '/url');

    expect(result).toBe('failed');
  });
});