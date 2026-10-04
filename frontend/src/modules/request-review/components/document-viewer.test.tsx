import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { DocumentViewer } from './document-viewer';

afterEach(cleanup);

function renderImageViewer() {
  return render(
    <DocumentViewer url="blob:test" mimeType="image/png" fileName="diploma.png" />,
  );
}

describe('DocumentViewer', () => {
  it('shows the image at 100 percent without rotation', () => {
    renderImageViewer();
    expect(screen.getByAltText('Documento de respaldo: diploma.png')).toBeTruthy();
    expect(screen.getByText('100 %')).toBeTruthy();
    expect(screen.getByTestId('viewer-canvas').style.transform).toBe(
      'scale(1) rotate(0deg)',
    );
  });

  it('zooms in and out', () => {
    renderImageViewer();
    fireEvent.click(screen.getByLabelText('Acercar'));
    expect(screen.getByText('125 %')).toBeTruthy();
    expect(screen.getByTestId('viewer-canvas').style.transform).toBe(
      'scale(1.25) rotate(0deg)',
    );

    fireEvent.click(screen.getByLabelText('Alejar'));
    fireEvent.click(screen.getByLabelText('Alejar'));
    expect(screen.getByText('75 %')).toBeTruthy();
  });

  it('stops at the maximum zoom', () => {
    renderImageViewer();
    const zoomIn = screen.getByLabelText('Acercar') as HTMLButtonElement;
    for (let i = 0; i < 10; i += 1) fireEvent.click(zoomIn);
    expect(screen.getByText('300 %')).toBeTruthy();
    expect(zoomIn.disabled).toBe(true);
  });

  it('stops at the minimum zoom', () => {
    renderImageViewer();
    const zoomOut = screen.getByLabelText('Alejar') as HTMLButtonElement;
    for (let i = 0; i < 10; i += 1) fireEvent.click(zoomOut);
    expect(screen.getByText('50 %')).toBeTruthy();
    expect(zoomOut.disabled).toBe(true);
  });

  it('rotates in steps of 90 degrees and returns to the start', () => {
    renderImageViewer();
    const rotate = screen.getByLabelText('Rotar');
    fireEvent.click(rotate);
    expect(screen.getByTestId('viewer-canvas').style.transform).toBe(
      'scale(1) rotate(90deg)',
    );
    for (let i = 0; i < 3; i += 1) fireEvent.click(rotate);
    expect(screen.getByTestId('viewer-canvas').style.transform).toBe(
      'scale(1) rotate(0deg)',
    );
  });

  it('shows the PDF with the browser viewer and disables zoom and rotation', () => {
    const { container } = render(
      <DocumentViewer url="blob:test" mimeType="application/pdf" fileName="diploma.pdf" />,
    );
    const element = container.querySelector('object');
    expect(element?.getAttribute('data')).toBe('blob:test');
    expect(screen.queryByTestId('viewer-canvas')).toBeNull();
    expect((screen.getByLabelText('Acercar') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText('Alejar') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText('Rotar') as HTMLButtonElement).disabled).toBe(true);
  });

  it('offers the document for download', () => {
    renderImageViewer();
    const link = screen.getByLabelText('Descargar documento');
    expect(link.getAttribute('href')).toBe('blob:test');
    expect(link.getAttribute('download')).toBe('diploma.png');
  });
});
