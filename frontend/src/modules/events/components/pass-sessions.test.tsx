import "@/shared/testing/indexed-db.mock";
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithQuery } from '@/shared/testing/render-with-query';
import { saveAccessToken, clearAccessToken } from '@/shared/services/storage/access-token-storage';
import { registrationsService } from '../services/registrations.service';
import { PassCard } from './pass-card';
import { PassDetail } from './pass-detail';

vi.mock('../services/registrations.service', () => ({ registrationsService: { getPass: vi.fn() } }));

const sessions = [
  { id: 's1', startsAt: '2026-12-02T13:00:00.000Z', endsAt: '2026-12-02T16:00:00.000Z', location: null },
  { id: 's2', startsAt: '2026-12-09T13:00:00.000Z', endsAt: '2026-12-09T16:00:00.000Z', location: null },
  { id: 's3', startsAt: '2026-12-16T13:00:00.000Z', endsAt: '2026-12-16T16:00:00.000Z', location: null },
];
const pass = {
  id: 'pass-1',
  eventName: 'Git en equipo',
  date: '2026-12-02',
  startTime: '09:00',
  endTime: '12:00',
  location: 'Laboratorio 1',
  status: 'Confirmada',
  sessions,
};

beforeEach(async () => {
  // Entre la primera y la segunda sesión.
  vi.useFakeTimers({ now: new Date('2026-12-05T12:00:00.000Z'), toFake: ['Date'] });
  vi.mocked(registrationsService.getPass).mockReset();
  await saveAccessToken('owner-token');
});
afterEach(() => {
  cleanup();
  clearAccessToken();
  vi.useRealTimers();
});

describe('Multi-session passes', () => {
  it('shows the next session on the pass card and keeps it valid between sessions', () => {
    render(
      <PassCard
        title={pass.eventName}
        date={pass.date}
        startTime={pass.startTime}
        endTime={pass.endTime}
        status={pass.status}
        location={pass.location}
        registrationId={pass.id}
        sessions={sessions}
      />,
    );
    expect(screen.getByText(/miércoles, 9 de diciembre/)).toBeInTheDocument();
    expect(screen.getByText('Sesión 2 de 3')).toBeInTheDocument();
    expect(screen.getByText('En curso')).toBeInTheDocument();
    expect(screen.queryByText('Finalizado')).not.toBeInTheDocument();
  });

  it('keeps the pass detail active after the first session and lists every session', async () => {
    vi.mocked(registrationsService.getPass).mockResolvedValue({ ...pass, qrToken: 'a'.repeat(64) });
    renderWithQuery(<PassDetail registration={pass} />);
    expect(await screen.findByText('Sesión 2 de 3')).toBeInTheDocument();
    expect(screen.queryByText(/Pase finalizado/)).not.toBeInTheDocument();
    const list = screen.getByRole('region', { name: 'Sesiones' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
  });

  it('finishes the pass only after the last session ends', async () => {
    vi.setSystemTime(new Date('2026-12-16T16:00:00.000Z'));
    renderWithQuery(<PassDetail registration={pass} offlineQrToken={'a'.repeat(64)} />);
    expect(await screen.findByText(/Pase finalizado/)).toBeInTheDocument();
  });

  it('keeps the single-session pass card unchanged', () => {
    render(
      <PassCard
        title={pass.eventName}
        date={pass.date}
        startTime={pass.startTime}
        endTime={pass.endTime}
        status={pass.status}
        location={pass.location}
        registrationId={pass.id}
        sessions={[sessions[0]]}
      />,
    );
    expect(screen.queryByText(/Sesión \d de/)).not.toBeInTheDocument();
    expect(screen.getByText('09:00 AM - 12:00 PM')).toBeInTheDocument();
  });
});
