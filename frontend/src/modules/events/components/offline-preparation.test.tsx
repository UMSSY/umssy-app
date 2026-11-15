import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { PwaInstallProvider } from '@/shared/contexts/pwa-install-context';
import {
  OfflinePreparation,
  OfflinePreparationProvider,
} from './offline-preparation';

const state = vi.hoisted(() => ({
  show: true,
  query: {
    isFetching: true,
    isPending: true,
    isError: false,
    refetch: vi.fn(),
  },
}));
vi.mock('../hooks/use-prepare-offline-passes', () => ({
  usePrepareOfflinePasses: () => ({ ...state }),
}));
vi.mock('@/shared/contexts/auth-context', () => ({
  useAuth: () => ({ roles: ['titulado'], isLoading: false }),
}));

it('waits for preparation before offering the native install prompt', () => {
  const tree = () => (
    <PwaInstallProvider>
      <OfflinePreparationProvider>
        <OfflinePreparation />
      </OfflinePreparationProvider>
    </PwaInstallProvider>
  );
  const { rerender } = render(tree());
  const prompt = vi.fn().mockResolvedValue(undefined);
  const event = Object.assign(
    new Event('beforeinstallprompt', { cancelable: true }),
    { prompt },
  );
  act(() => {
    window.dispatchEvent(event);
  });
  expect(event.defaultPrevented).toBe(true);
  expect(screen.getByRole('status')).toHaveTextContent('Guardando tus pases');
  expect(
    screen.queryByRole('button', { name: 'Instalar app' }),
  ).not.toBeInTheDocument();

  state.query = {
    ...state.query,
    isFetching: false,
    isPending: false,
    isError: true,
  };
  rerender(tree());
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  expect(state.query.refetch).toHaveBeenCalledOnce();
  expect(
    screen.queryByRole('button', { name: 'Instalar app' }),
  ).not.toBeInTheDocument();

  state.query = { ...state.query, isError: false };
  rerender(tree());
  expect(screen.getByRole('status')).toHaveTextContent(
    'Pases listos sin conexión',
  );
  expect(prompt).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Instalar app' }));
  expect(prompt).toHaveBeenCalledOnce();
});
