import type { NotificationPayloadMap } from '../../notifications/types/notification-payload-map.type.js';
import type { NotificationTemplateDefinition } from '../../notifications/types/notification-template-definition.type.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';
import { truncateNotificationText as truncate } from '../../notifications/utils/truncate-notification-text.js';
import type { CompanyRequestNotification } from '../types/company-request-notification.type.js';
import {
  renderCompanyRequestApprovedMail,
  renderCompanyRequestObservedMail,
  renderCompanyRequestRejectedMail,
} from './company-request-notification-mails.js';
import {
  companyRequestApprovedPayloadSchema,
  companyRequestObservedPayloadSchema,
  companyRequestRejectedPayloadSchema,
} from './company-request-notification-payloads.schema.js';

export const COMPANY_REQUEST_APPROVED_TEMPLATE: NotificationTemplateDefinition<NotificationType.COMPANY_ACCESS_REQUEST_APPROVED> =
  {
    renderTitle: () => 'Solicitud de empresa aprobada',
    renderBody: (p) =>
      truncate(
        `La solicitud de ${p.companyName} (${p.requestCode}) fue aprobada. Activa tu cuenta con el código enviado.`,
      ),
  };

export const COMPANY_REQUEST_OBSERVED_TEMPLATE: NotificationTemplateDefinition<NotificationType.COMPANY_ACCESS_REQUEST_OBSERVED> =
  {
    renderTitle: () => 'Observaciones en solicitud de empresa',
    renderBody: (p) =>
      truncate(
        `La solicitud de ${p.companyName} (${p.requestCode}) requiere subsanación: ${p.reason}`,
      ),
  };

export const COMPANY_REQUEST_REJECTED_TEMPLATE: NotificationTemplateDefinition<NotificationType.COMPANY_ACCESS_REQUEST_REJECTED> =
  {
    renderTitle: () => 'Solicitud de empresa rechazada',
    renderBody: (p) =>
      truncate(
        `La solicitud de ${p.companyName} (${p.requestCode}) fue rechazada: ${p.reason}`,
      ),
  };

export function companyRequestApprovedNotification(
  input: NotificationPayloadMap[NotificationType.COMPANY_ACCESS_REQUEST_APPROVED],
): CompanyRequestNotification<NotificationType.COMPANY_ACCESS_REQUEST_APPROVED> {
  const payload = companyRequestApprovedPayloadSchema.parse(input);
  return {
    type: NotificationType.COMPANY_ACCESS_REQUEST_APPROVED,
    payload,
    renderMail: () => renderCompanyRequestApprovedMail(payload),
  };
}

export function companyRequestObservedNotification(
  input: NotificationPayloadMap[NotificationType.COMPANY_ACCESS_REQUEST_OBSERVED],
): CompanyRequestNotification<NotificationType.COMPANY_ACCESS_REQUEST_OBSERVED> {
  const payload = companyRequestObservedPayloadSchema.parse(input);
  return {
    type: NotificationType.COMPANY_ACCESS_REQUEST_OBSERVED,
    payload,
    renderMail: () => renderCompanyRequestObservedMail(payload),
  };
}

export function companyRequestRejectedNotification(
  input: NotificationPayloadMap[NotificationType.COMPANY_ACCESS_REQUEST_REJECTED],
): CompanyRequestNotification<NotificationType.COMPANY_ACCESS_REQUEST_REJECTED> {
  const payload = companyRequestRejectedPayloadSchema.parse(input);
  return {
    type: NotificationType.COMPANY_ACCESS_REQUEST_REJECTED,
    payload,
    renderMail: () => renderCompanyRequestRejectedMail(payload),
  };
}
