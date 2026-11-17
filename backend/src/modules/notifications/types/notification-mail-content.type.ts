import type { MailTemplateName } from '../../mail/types/mail-template-name.types.js';

export interface NotificationMailContent {
  template: MailTemplateName;
  subject: string;
  text: string;
  values: Record<string, string>;
}
