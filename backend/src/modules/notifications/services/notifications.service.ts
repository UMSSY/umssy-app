import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationsRepository } from '../repositories/notifications.repository.js';
import { PreferencesRepository } from '../repositories/preferences.repository.js';
import { NotificationUserLookupRepository } from '../repositories/notification-user-lookup.repository.js';
import { PushDispatcherService } from './push-dispatcher.service.js';
import { MailDispatcherService } from './mail-dispatcher.service.js';
import { AppVisibilityService } from './app-visibility.service.js';
import { NotificationGateway } from '../gateways/notification.gateway.js';
import { NOTIFICATION_TEMPLATES } from '../constants/notification-templates.constants.js';
import type { NotifyRequest } from '../types/notify-request.type.js';
import type { NotifyResult } from '../types/notify-result.type.js';
import { NotificationType } from '../types/notification-type.enum.js';
import type { NotificationTemplateDefinition } from '../types/notification-template-definition.type.js';
import { normalizeNotificationPayload } from '../utils/normalize-notification-payload.js';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly preferencesRepository: PreferencesRepository,
    private readonly userLookupRepository: NotificationUserLookupRepository,
    private readonly pushDispatcher: PushDispatcherService,
    private readonly mailDispatcher: MailDispatcherService,
    private readonly notificationGateway: NotificationGateway,
    private readonly appVisibilityService: AppVisibilityService,
  ) {}

  async notify(request: NotifyRequest): Promise<NotifyResult> {
    const {
      recipientIds,
      actorId,
      type,
      payload,
      actionUrl,
      groupKey,
      channels,
    } = request;
    const includeInApp = !channels || channels.includes('IN_APP');

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

    const typeRecord = await this.notificationsRepository.findTypeByCode(type);
    if (!typeRecord) {
      throw new NotFoundException(`NotificationType ${type} no encontrado en el catálogo`);
    }

    const template = NOTIFICATION_TEMPLATES[type] as NotificationTemplateDefinition<NotificationType>;
    if (!template) {
      throw new NotFoundException(`Plantilla no encontrada para el tipo ${type}`);
    }

    const normalizedPayload = normalizeNotificationPayload(payload);
    const title = template.renderTitle(normalizedPayload);
    const body = template.renderBody(normalizedPayload);

    const preferences = await this.preferencesRepository.findManyByUserIds(validRecipients);
    
    const pushTargets: string[] = [];
    const emailTargets: string[] = [];

    for (const recipientId of validRecipients) {
      const userPref = preferences.find((p) => p.userId === recipientId);
      const pushEnabled = userPref ? userPref.pushEnabled : false;
      const emailEnabled = userPref ? userPref.emailEnabled : true;

      const appVisible = this.appVisibilityService.isVisible(recipientId);
      if (typeRecord.sendsPush && pushEnabled && !appVisible) pushTargets.push(recipientId);
      if (typeRecord.sendsEmail && emailEnabled) emailTargets.push(recipientId);
    }

    const createdNotifications = includeInApp
      ? await this.notificationsRepository.createMany(
          validRecipients.map((id) => ({
            recipientId: id,
            actorId: actorId,
            typeId: typeRecord.id,
            title,
            body,
            link: actionUrl,
            groupKey,
          })),
        )
      : [];
    const inAppCount = createdNotifications.length;
    const notificationIdsByRecipient = new Map(
      createdNotifications.map((notification) => [notification.recipientId, notification.id]),
    );

    if (includeInApp) {
      for (const recipientId of validRecipients) {
        this.notificationGateway.emitToUser(recipientId, 'notification:new', {
          typeCode: type,
          title,
          body,
          actionUrl,
        });
      }
    }

    let pushStatus: NotifyResult['pushStatus'] = 'skipped';
    let emailStatus: NotifyResult['emailStatus'] = 'skipped';

    if (pushTargets.length > 0) {
      try {
        pushStatus = await this.pushDispatcher.dispatchToUsers(
          pushTargets,
          title,
          body,
          actionUrl,
          groupKey,
          notificationIdsByRecipient,
        );
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