import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { OfflineNavigation } from './offline-navigation';
import { useUnsavedChangesGuard } from '@/shared/hooks/use-unsaved-changes-guard';
import { openOfflineRoute } from '@/shared/services/offline-navigation';

vi.mock('@/shared/services/offline-navigation', () => ({
  BEFORE_OFFLINE_NAVIGATION: 'umssy:before-offline-navigation',
  openOfflineRoute: vi.fn(),
}));

function Guard() {
  const { pendingHref } = useUnsavedChangesGuard(true);
  return <p data-testid="pending">{pendingHref}</p>;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.mocked(openOfflineRoute).mockClear();
});

it.each([true, false])(
  'preserves the unsaved changes guard regardless of listener order (%s)',
  (guardFirst) => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    render(
      <>
        {guardFirst ? <Guard /> : null}
        <OfflineNavigation />
        {!guardFirst ? <Guard /> : null}
        <a href="/events?tab=1">Talleres</a>
      </>,
    );
    fireEvent.click(screen.getByRole('link', { name: 'Talleres' }));
    expect(screen.getByTestId('pending')).toHaveTextContent('/events?tab=1');
    expect(openOfflineRoute).not.toHaveBeenCalled();
  },
);

it('opens a saved route when no form blocks navigation', () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  render(
    <>
      <OfflineNavigation />
      <a href="/events">Talleres</a>
    </>,
  );
  fireEvent.click(screen.getByRole('link', { name: 'Talleres' }));
  expect(openOfflineRoute).toHaveBeenCalledOnce();
});
