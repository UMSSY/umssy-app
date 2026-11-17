import { cp, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const target = new URL('../dist/modules/mail/mjml/', import.meta.url);
await mkdir(target, { recursive: true });
await cp(new URL('../src/modules/mail/mjml/', import.meta.url), target, {
  recursive: true,
});

const modulesDir = new URL('../src/modules/', import.meta.url);
for (const entry of await readdir(modulesDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const source = new URL(`${entry.name}/notification/mjml/`, modulesDir);
  if (!existsSync(source)) continue;
  await cp(
    source,
    new URL(
      `../dist/modules/${entry.name}/notification/mjml/`,
      import.meta.url,
    ),
    { recursive: true },
  );
}