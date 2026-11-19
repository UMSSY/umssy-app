import { loadMailTemplate } from '../../mail/helpers/load-mail-template.js';

export const loadAppointmentMailTemplate = (name: string): Promise<string> =>
  loadMailTemplate(new URL(`./mjml/${name}.mjml`, import.meta.url));
