import type { loadMailTemplate } from '../../mail/helpers/load-mail-template.js';

export type NotificationEmailContent = {
  template: Parameters<typeof loadMailTemplate>[0];
  subject: string;
  text: string;
  values: Record<string, string>;
};
