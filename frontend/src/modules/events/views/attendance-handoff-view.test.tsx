import { cleanup, render, screen } from '@testing-library/react';
import { Resvg } from '@resvg/resvg-js';
import jsQR from 'jsqr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useManagedWorkshops } from '../hooks/use-managed-workshops';
import { AttendanceHandoffView } from './attendance-handoff-view';

vi.mock('../hooks/use-managed-workshops', () => ({ useManagedWorkshops: vi.fn() }));
const workshop = { id: 'workshop-1', title: 'Taller de QR', eventDate: '2027-06-24', startTime: '14:00', endTime: '17:00', location: 'Aula 101' };

beforeEach(() => {
  vi.useFakeTimers({ now: new Date('2026-11-16T12:00:00Z'), toFake: ['Date'] });
  vi.mocked(useManagedWorkshops).mockReturnValue({ workshops: [workshop], isLoading: false, error: null, retry: vi.fn() });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('continuar en celular', () => {
  it('encodes only the current workshop route, without session data', () => {
    render(<AttendanceHandoffView workshopId="workshop-1" />);
    const url = 'http://localhost:3000/events/my-workshops/workshop-1/attendance';
    const svg = screen.getByRole('img', { name: 'Código QR para continuar en el celular' });
    const rendered = new Resvg(svg.outerHTML, { fitTo: { mode: 'width', value: 660 } }).render();
    const decoded = jsQR(new Uint8ClampedArray(rendered.pixels), rendered.width, rendered.height);
    expect(decoded?.data).toBe(url);
    expect(screen.queryByRole('link', { name: url })).not.toBeInTheDocument();
    expect(document.querySelector('img')?.getAttribute('src')).toContain('icon-qr-register.webp');
    expect(screen.getAllByText('Taller de QR')).toHaveLength(2);
  });

  it('does not display the handoff for a workshop absent from the managed list', () => {
    render(<AttendanceHandoffView workshopId="another-workshop" />);
    expect(screen.getByRole('alert')).toHaveTextContent('no está entre los talleres');
    expect(screen.queryByRole('img', { name: 'Código QR para continuar en el celular' })).not.toBeInTheDocument();
  });
});
