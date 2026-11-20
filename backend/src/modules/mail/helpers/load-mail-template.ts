import { readFile } from 'node:fs/promises';
import type { MailTemplateName } from '../types/mail-template-name.types.js';

export function loadMailTemplate(template: MailTemplateName | URL): Promise<string> {
  const location =
    template instanceof URL ? template : new URL(`../mjml/${template}.mjml`, import.meta.url);
  return readFile(location, 'utf8');
}
