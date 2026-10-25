import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import mjml2html from 'mjml';

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char]!,
  );
}

@Injectable()
export class MailTemplateService {
  async render(
    content: string,
    values: Record<string, string>,
  ): Promise<string> {
    const directory = new URL('../mjml/', import.meta.url);
    const [layout, header] = await Promise.all(
      ['layout', 'header'].map((name) =>
        readFile(new URL(`${name}.mjml`, directory), 'utf8'),
      ),
    );
    const brandedHeader = values.logoUrl
      ? header
      : header.replace(/<mj-image[^>]*\/>/g, '');
    const source = layout
      .replace(/{{\s*header\s*}}/, () => brandedHeader)
      .replace(/{{\s*content\s*}}/, () => content)
      .replace(/{{\s*(\w+)\s*}}/g, (_, key: string) => {
        if (!(key in values))
          throw new Error(`Missing mail template variable: ${key}`);
        return escapeHtml(values[key]);
      });
    const result = await mjml2html(source, {
      validationLevel: 'strict',
      ignoreIncludes: true,
    });
    return result.html;
  }
}
