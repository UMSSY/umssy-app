import { Injectable } from '@nestjs/common';

@Injectable()
export class RadarPdfExtractionService {
  async extract(
    buffer: Buffer,
  ): Promise<{
    extractedText: string;
    extractionStatus: 'ready' | 'unreadable' | 'error';
  }> {
    let extractedText = '';
    let extractionStatus: 'ready' | 'unreadable' | 'error' = 'unreadable';
    try {
      const mupdf = await import('mupdf');
      const document = mupdf.Document.openDocument(
        new Uint8Array(buffer),
        'application/pdf',
      );
      try {
        const pages: string[] = [];
        for (let i = 0; i < Math.min(document.countPages(), 40); i++) {
          const page = document.loadPage(i);
          try {
            const text = page.toStructuredText('');
            try {
              pages.push(text.asText());
            } finally {
              text.destroy();
            }
          } finally {
            page.destroy();
          }
        }
        extractedText = pages.join('\n').slice(0, 20_000);
        extractionStatus = extractedText.trim() ? 'ready' : 'unreadable';
      } finally {
        document.destroy();
      }
    } catch {
      extractionStatus = 'error';
    }
    return { extractedText, extractionStatus };
  }
}
