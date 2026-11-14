import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationsRepository } from '../repositories/notifications.repository.js';
import { PreferencesRepository } from '../repositories/preferences.repository.js';
import { NotificationUserLookupRepository } from '../repositories/notification-user-lookup.repository.js';
import { PushDispatcherService } from './push-dispatcher.service.js';
import { MailDispatcherService } from './mail-dispatcher.service.js';
import { NOTIFICATION_CATALOG } from '../constants/notification-catalog.constants.js';
import { NOTIFICATION_TEMPLATES } from '../constants/notification-templates.constants.js';
import type { NotifyRequest } from '../types/notify-request.type.js';
import type { NotifyResult } from '../types/notify-result.type.js';
import { NotificationType } from '../types/notification-type.enum.js';
import type { NotificationTemplateDefinition } from '../types/notification-template-definition.type.js';
import { NotificationGateway } from '../gateways/notification.gateway.js'; 

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject(NotificationsRepository)
    private readonly notificationsRepository: NotificationsRepository,
    
    @Inject(PreferencesRepository)
    private readonly preferencesRepository: PreferencesRepository,
    
    @Inject(NotificationUserLookupRepository)
    private readonly userLookupRepository: NotificationUserLookupRepository,
    
    @Inject(PushDispatcherService)
    private readonly pushDispatcher: PushDispatcherService,
    
    @Inject(MailDispatcherService)
    private readonly mailDispatcher: MailDispatcherService,
    
    @Inject(NotificationGateway)
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async notify(request: NotifyRequest): Promise<NotifyResult> {
    const { recipientIds, actorId, type, payload, actionUrl, groupKey } = request;

    const finalRecipients = recipientIds.filter((id) => id !== actorId);
    if (finalRecipients.length === 0) {
      return { inAppCount: 0, pushStatus: 'skipped', emailStatus: 'skipped' };
    }

    const validRecipients: string[] = [];
    for (const recipientId of finalRecipients) {
      if (actorId && (await this.userLookupRepository.hasBlockBetween(actorId, recipientId))) {
        continue; 
      }
      validRecipients.push(recipientId);
    }

    if (validRecipients.length === 0) {
      return { inAppCount: 0, pushStatus: 'skipped', emailStatus: 'skipped' };
    }

    const template = NOTIFICATION_TEMPLATES[type] as NotificationTemplateDefinition<NotificationType>;
    const title = template.renderTitle(payload);
    const body = template.renderBody(payload);

    const catalog = NOTIFICATION_CATALOG[type];
    const preferences = await this.preferencesRepository.findManyByUserIds(validRecipients);
    
    const pushTargets: string[] = [];
    const emailTargets: string[] = [];

    for (const recipientId of validRecipients) {
      const userPref = preferences.find((p) => p.userId === recipientId);
      const pushEnabled = userPref ? userPref.pushEnabled : false;
      const emailEnabled = userPref ? userPref.emailEnabled : true;

      if (catalog.sendsPush && pushEnabled) pushTargets.push(recipientId);
      if (catalog.sendsEmail && emailEnabled) emailTargets.push(recipientId);
    }

    const typeRecord = await this.notificationsRepository.findTypeByCode(type);
    if (!typeRecord) throw new NotFoundException(`NotificationType ${type} no encontrado`);

    const inAppCount = await this.notificationsRepository.createMany(
      validRecipients.map((id) => ({
        recipientId: id,
        actorId: actorId,
        typeId: typeRecord.id,
        title,
        body,
        link: actionUrl,
        groupKey,
      })),
    );

    for (const recipientId of validRecipients) {
      this.notificationGateway.emitToUser(recipientId, 'notification:new', { title, body, actionUrl });
    }

    let pushStatus: NotifyResult['pushStatus'] = 'skipped';
    let emailStatus: NotifyResult['emailStatus'] = 'skipped';

    if (pushTargets.length > 0) {
      try {
        pushStatus = await this.pushDispatcher.dispatchToUsers(pushTargets, title, body, actionUrl, groupKey);
      } catch (e) {
        this.logger.error('Fallo crítico en PushDispatcher', e);
        pushStatus = 'failed';
      }
    }

    if (emailTargets.length > 0) {
      try {
        emailStatus = await this.mailDispatcher.dispatchToUsers(emailTargets, title, body, actionUrl);
      } catch (e) {
        this.logger.error('Fallo crítico en MailDispatcher', e);
        emailStatus = 'failed';
      }
    }

    return { inAppCount, pushStatus, emailStatus };
  }
}