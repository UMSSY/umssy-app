import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LinkPreviewService } from './link-preview.service.js';
import { InvalidLinkUrlException } from '../exceptions/invalid-link-url.exception.js';
import { BlockedLinkUrlException } from '../exceptions/blocked-link-url.exception.js';

describe('LinkPreviewService', () => {
  let service: LinkPreviewService;

  beforeEach(() => {
    service = new LinkPreviewService();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('URL & SSRF validation', () => {
    it('throws InvalidLinkUrlException for malformed URLs', async () => {
      await expect(service.getPreview('not-a-url')).rejects.toThrow(
        InvalidLinkUrlException,
      );
    });

    it('throws InvalidLinkUrlException for non-http protocols', async () => {
      await expect(service.getPreview('javascript:alert(1)')).rejects.toThrow(
        InvalidLinkUrlException,
      );
      await expect(service.getPreview('ftp://example.com/file')).rejects.toThrow(
        InvalidLinkUrlException,
      );
    });

    it('throws BlockedLinkUrlException for localhost and private IP targets', async () => {
      await expect(
        service.getPreview('http://localhost:3000/api'),
      ).rejects.toThrow(BlockedLinkUrlException);

      await expect(
        service.getPreview('http://127.0.0.1/status'),
      ).rejects.toThrow(BlockedLinkUrlException);

      await expect(
        service.getPreview('http://169.254.169.254/latest/meta-data/'),
      ).rejects.toThrow(BlockedLinkUrlException);

      await expect(
        service.getPreview('http://192.168.1.10/admin'),
      ).rejects.toThrow(BlockedLinkUrlException);
    });
  });

  describe('HTML metadata & Open Graph extraction', () => {
    it('extracts og:title, og:description, and resolves relative og:image', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Ignored Title</title>
            <meta property="og:title" content="Awesome Project &amp; Portfolio" />
            <meta property="og:description" content="Explore top-notch web development." />
            <meta property="og:image" content="/assets/preview.png" />
          </head>
          <body>Hello</body>
        </html>
      `;

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(mockHtml, {
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        }),
      );

      const result = await service.getPreview('https://example.com/portfolio');

      expect(result.hasPreview).toBe(true);
      expect(result.domain).toBe('example.com');
      expect(result.title).toBe('Awesome Project & Portfolio');
      expect(result.description).toBe('Explore top-notch web development.');
      expect(result.imageUrl).toBe('https://example.com/assets/preview.png');
    });

    it('falls back to standard <title> and <meta name="description"> when og tags are absent', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>My Simple Blog</title>
            <meta name="description" content="A simple personal blog." />
          </head>
          <body>Content</body>
        </html>
      `;

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(mockHtml, {
          status: 200,
          headers: { 'content-type': 'text/html' },
        }),
      );

      const result = await service.getPreview('https://example.org/blog');

      expect(result.hasPreview).toBe(true);
      expect(result.title).toBe('My Simple Blog');
      expect(result.description).toBe('A simple personal blog.');
      expect(result.imageUrl).toBeNull();
    });

    it('returns fallback with hasPreview: false when response status is not 200 OK', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('Not Found', {
          status: 404,
          headers: { 'content-type': 'text/html' },
        }),
      );

      const result = await service.getPreview('https://example.com/missing');

      expect(result.hasPreview).toBe(false);
      expect(result.title).toBeNull();
      expect(result.domain).toBe('example.com');
    });

    it('returns fallback when Content-Type is not HTML (e.g., application/pdf)', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('%PDF-1.4...', {
          status: 200,
          headers: { 'content-type': 'application/pdf' },
        }),
      );

      const result = await service.getPreview('https://example.com/doc.pdf');

      expect(result.hasPreview).toBe(false);
      expect(result.title).toBeNull();
    });

    it('returns fallback gracefully when network fetch times out or throws an error', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
        new Error('Network connection aborted'),
      );

      const result = await service.getPreview('https://example.com/timeout');

      expect(result.hasPreview).toBe(false);
      expect(result.title).toBeNull();
    });

    it('truncates excessively long titles and descriptions', async () => {
      const longTitle = 'A'.repeat(300);
      const longDesc = 'B'.repeat(600);

      const mockHtml = `
        <html>
          <head>
            <meta property="og:title" content="${longTitle}" />
            <meta property="og:description" content="${longDesc}" />
          </head>
        </html>
      `;

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(mockHtml, {
          status: 200,
          headers: { 'content-type': 'text/html' },
        }),
      );

      const result = await service.getPreview('https://example.com/long');

      expect(result.title?.length).toBe(200);
      expect(result.description?.length).toBe(400);
    });
  });
});

