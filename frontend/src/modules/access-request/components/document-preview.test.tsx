import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { DocumentPreview } from './document-preview';

afterEach(cleanup);

describe('DocumentPreview', () => {
  it('renders an object element for PDF files', () => {
    const { container } = render(
      <DocumentPreview url="blob:test" mimeType="application/pdf" fileName="diploma.pdf" />,
    );
    const element = container.querySelector('object');
    expect(element).not.toBeNull();
    expect(element?.getAttribute('data')).toBe('blob:test');
  });

  it('renders an image for non-PDF files', () => {
    render(
      <DocumentPreview url="blob:test" mimeType="image/png" fileName="diploma.png" />,
    );
    expect(screen.getByAltText('Vista previa de diploma.png')).toBeTruthy();
  });
});
