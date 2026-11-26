import { loadMailTemplate } from '../../mail/helpers/load-mail-template.js';
import type { NotificationMailContent } from '../../notifications/types/notification-mail-content.type.js';
import type { NotificationPayloadMap } from '../../notifications/types/notification-payload-map.type.js';
import type { NotificationType } from '../../notifications/types/notification-type.enum.js';

const loadCompanyMailTemplate = (name: string): Promise<string> =>
  loadMailTemplate(new URL(`./mjml/${name}.mjml`, import.meta.url));

export async function renderCompanyRequestApprovedMail({
  companyName,
  requestCode,
  activationCode,
  expiresInMinutes,
  activationUrl,
}: NotificationPayloadMap[NotificationType.COMPANY_ACCESS_REQUEST_APPROVED]): Promise<NotificationMailContent> {
  return {
    mjml: await loadCompanyMailTemplate('company-request-approved'),
    subject: 'Tu código de activación de UMSSY para empresa',
    text: `Tu solicitud de acceso para ${companyName} (${requestCode}) fue aprobada.\n\nCódigo de activación: ${activationCode}\nCódigo de seguimiento: ${requestCode}\nVence en 48 horas.\n\nPara activar tu cuenta y configurar tus credenciales de acceso, ingresa al siguiente enlace oficial:\n${activationUrl}\n\nEn la pantalla se te solicitará ingresar obligatoriamente tu código de seguimiento institucional (${requestCode}) para validar tu identidad.`,
    values: {
      companyName,
      requestCode,
      code: activationCode,
      expiresInMinutes,
      activationUrl,
    },
  };
}

export async function renderCompanyRequestObservedMail({
  companyName,
  requestCode,
  reason,
  requestStatusUrl,
}: NotificationPayloadMap[NotificationType.COMPANY_ACCESS_REQUEST_OBSERVED]): Promise<NotificationMailContent> {
  return {
    mjml: await loadCompanyMailTemplate('company-request-observed'),
    subject: 'Observaciones a tu solicitud de registro de empresa en UMSSY',
    text: `Tu solicitud de acceso para ${companyName} (${requestCode}) requiere subsanación.\n\nMotivo:\n${reason}\n\nConsulta el estado y realiza las correcciones en: ${requestStatusUrl}`,
    values: {
      companyName,
      requestCode,
      reason,
      requestStatusUrl,
    },
  };
}

export async function renderCompanyRequestRejectedMail({
  companyName,
  requestCode,
  reason,
  requestStatusUrl,
}: NotificationPayloadMap[NotificationType.COMPANY_ACCESS_REQUEST_REJECTED]): Promise<NotificationMailContent> {
  return {
    mjml: await loadCompanyMailTemplate('company-request-rejected'),
    subject: 'Dictamen de tu solicitud de registro de empresa en UMSSY',
    text: `Tu solicitud de acceso para ${companyName} (${requestCode}) fue rechazada.\n\nMotivo del rechazo:\n${reason}\n\nConsulta el estado en: ${requestStatusUrl}`,
    values: {
      companyName,
      requestCode,
      reason,
      requestStatusUrl,
    },
  };
}
