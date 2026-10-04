import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { UploadedDocumentCard } from './uploaded-document-card';

const baseProps = {
  fileName: 'diploma.pdf',
  fileSize: 2 * 1024 * 1024,
  progress: 40,
  isRemoving: false,
  onView: vi.fn(),
  onRemove: vi.fn(),
};
afterEach(cleanup);
describe('UploadedDocumentCard', () => {
  it('shows the progress bar while uploading', () => {
    render(<UploadedDocumentCard {...baseProps} isUploading />);
    expect(screen.getByRole('progressbar')).toBeTruthy();
    expect(screen.queryByText('Listo')).toBeNull();
  });

  it('shows name, size and status when the upload finishes', () => {
    render(<UploadedDocumentCard {...baseProps} isUploading={false} />);
    expect(screen.getByText('diploma.pdf')).toBeTruthy();
    expect(screen.getByText('2,0 MB')).toBeTruthy();
    expect(screen.getByText('Listo')).toBeTruthy();
  });

  it('calls onRemove and onView from the buttons', () => {
    const onRemove = vi.fn();
    const onView = vi.fn();
    render(
      <UploadedDocumentCard
        {...baseProps}
        isUploading={false}
        onRemove={onRemove}
        onView={onView}
      />,
    );
    fireEvent.click(screen.getByText('Quitar'));
    fireEvent.click(screen.getByText('Ver'));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onView).toHaveBeenCalledTimes(1);
  });
});