import type { MailTemplateName } from '../../mail/types/mail-template-name.types.js';

export type NotificationEmailContent = {
  template: MailTemplateName;
  subject: string;
  text: string;
  values: Record<string, string>;
};
