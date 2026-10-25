import { cp, mkdir } from 'node:fs/promises';

const target = new URL('../dist/modules/mail/mjml/', import.meta.url);
await mkdir(target, { recursive: true });
await cp(new URL('../src/modules/mail/mjml/', import.meta.url), target, {
  recursive: true,
});
