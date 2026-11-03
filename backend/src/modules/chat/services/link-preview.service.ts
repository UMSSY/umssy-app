import { Injectable } from '@nestjs/common';
import { validateSafeUrl } from '../utils/ssrf-validator.js';
import { InvalidLinkUrlException } from '../exceptions/invalid-link-url.exception.js';
import { BlockedLinkUrlException } from '../exceptions/blocked-link-url.exception.js';
import type { LinkPreviewResponse } from '../responses/link-preview.response.js';

const REQUEST_TIMEOUT_MS = 4000;
const MAX_HTML_BYTES = 512 * 1024; // 512 KB
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 400;

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function extractMetaTag(html: string, property: string): string | null {
  // Matches <meta property="og:title" content="..."> or <meta name="og:title" content="..."> or reverse order
  const escapedProp = property.replace(':', '\\:');
  const pattern1 = new RegExp(
    `<meta\\s+[^>]*(?:property|name)=["']${escapedProp}["'][^>]*content=["']([^"']*)["']`,
    'i',
  );
  const pattern2 = new RegExp(
    `<meta\\s+[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${escapedProp}["']`,
    'i',
  );

  const match1 = pattern1.exec(html);
  if (match1?.[1]) {
    return decodeHtmlEntities(match1[1]);
  }

  const match2 = pattern2.exec(html);
  if (match2?.[1]) {
    return decodeHtmlEntities(match2[1]);
  }

  return null;
}

function extractTitleTag(html: string): string | null {
  const match = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  if (!match?.[1]) {
    return null;
  }
  const clean = decodeHtmlEntities(match[1]);
  return clean.length > 0 ? clean : null;
}

@Injectable()
export class LinkPreviewService {
  async getPreview(rawUrl: string): Promise<LinkPreviewResponse> {
    const trimmedUrl = (rawUrl ?? '').trim();
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      throw new InvalidLinkUrlException();
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new InvalidLinkUrlException();
    }

    const isSafe = await validateSafeUrl(trimmedUrl);
    if (!isSafe) {
      throw new BlockedLinkUrlException(
        trimmedUrl,
        'Dirección IP o dominio no permitido',
      );
    }

    const domain = parsedUrl.hostname;
    const fallback: LinkPreviewResponse = {
      url: trimmedUrl,
      domain,
      title: null,
      description: null,
      imageUrl: null,
      hasPreview: false,
    };

    try {
      const response = await fetch(trimmedUrl, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
      });

      if (!response.ok) {
        return fallback;
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (
        !contentType.includes('text/html') &&
        !contentType.includes('application/xhtml+xml')
      ) {
        return fallback;
      }

      // Read at most MAX_HTML_BYTES to prevent memory abuse
      const buffer = await response.arrayBuffer();
      const slicedBuffer = buffer.slice(0, MAX_HTML_BYTES);
      const html = new TextDecoder('utf-8').decode(slicedBuffer);

      // Extract Open Graph & HTML metadata
      const ogTitle = extractMetaTag(html, 'og:title');
      const standardTitle = extractTitleTag(html);
      const title = (ogTitle ?? standardTitle)?.slice(0, MAX_TITLE_LENGTH) ?? null;

      const ogDescription = extractMetaTag(html, 'og:description');
      const standardDescription = extractMetaTag(html, 'description');
      const description =
        (ogDescription ?? standardDescription)?.slice(0, MAX_DESCRIPTION_LENGTH) ??
        null;

      const rawOgImage = extractMetaTag(html, 'og:image');
      let imageUrl: string | null = null;

      if (rawOgImage) {
        try {
          // Resolve relative URLs to absolute URLs
          const resolved = new URL(rawOgImage, trimmedUrl).href;
          // Validate resolved image URL against SSRF
          const isImageSafe = await validateSafeUrl(resolved);
          if (isImageSafe) {
            imageUrl = resolved;
          }
        } catch {
          imageUrl = null;
        }
      }

      const hasPreview = Boolean(title || description);

      return {
        url: trimmedUrl,
        domain,
        title,
        description,
        imageUrl,
        hasPreview,
      };
    } catch {
      // In case of timeout, connection reset, or parsing errors, return safe fallback
      return fallback;
    }
  }
}

