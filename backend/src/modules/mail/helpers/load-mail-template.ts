import { readFile } from 'node:fs/promises';
import type { MailTemplateName } from '../types/mail-template-name.types.js';

export function loadMailTemplate(name: MailTemplateName): Promise<string> {
  return readFile(new URL(`../mjml/${name}.mjml`, import.meta.url), 'utf8');
}
