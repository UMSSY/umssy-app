// @vitest-environment node
import { renderToStaticMarkup } from 'react-dom/server';
import { Resvg } from '@resvg/resvg-js';
import jsQR from 'jsqr';
import { describe, expect, it } from 'vitest';
import { PassQr } from './pass-qr';

describe('Real pass QR encoding', () => {
  it.each(['a'.repeat(64), '0123456789abcdef'.repeat(4)])('a QR reader recovers the exact versioned token %s', (token) => {
    const svg = renderToStaticMarkup(<PassQr token={token} />);
    const rendered = new Resvg(svg, { fitTo: { mode: 'width', value: 660 } }).render();
    const decoded = jsQR(new Uint8ClampedArray(rendered.pixels), rendered.width, rendered.height);
    expect(decoded?.data).toBe(`v1:${token}`);
  });
});
