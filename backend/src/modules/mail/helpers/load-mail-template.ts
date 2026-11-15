import { readFile } from 'node:fs/promises';

type MailTemplateName =
  | 'activation-code'
  | 'account-activated'
  | 'access-request-rejection'
  | 'password-reset-email'
  | 'survey-closing-soon'
  | 'survey-closed'
  | 'survey-variation-alert'
  | 'survey-reminder';

export function loadMailTemplate(name: MailTemplateName): Promise<string> {
  return readFile(new URL(`../mjml/${name}.mjml`, import.meta.url), 'utf8');
}
