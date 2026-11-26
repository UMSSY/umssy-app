import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
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

const tree = () => (
  <PwaInstallProvider>
    <OfflinePreparationProvider>
      <OfflinePreparation />
    </OfflinePreparationProvider>
  </PwaInstallProvider>
);

beforeEach(() => {
  state.query = {
    isFetching: true,
    isPending: true,
    isError: false,
    refetch: vi.fn(),
  };
  mockDisplayMode(false);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function mockDisplayMode(standalone: boolean) {
  vi.stubGlobal('matchMedia', () => ({
    matches: standalone,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

it('waits for preparation before offering the native install prompt', () => {
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
  expect(screen.getByRole('status')).toHaveTextContent(
    'Datos sin conexión pendientes.',
  );
  expect(screen.getByRole('button', { name: 'Instalar app' })).toBeVisible();

  state.query = { ...state.query, isError: false };
  rerender(tree());
  expect(screen.getByRole('status')).toHaveTextContent(
    'Pases listos sin conexión',
  );
  expect(prompt).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Instalar app' }));
  expect(prompt).toHaveBeenCalledOnce();
});

it('allows installation after a download error without claiming offline readiness', () => {
  state.query = {
    ...state.query,
    isFetching: false,
    isPending: false,
    isError: true,
  };
  render(tree());
  const prompt = vi.fn().mockResolvedValue(undefined);
  act(() =>
    window.dispatchEvent(
      Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
        prompt,
      }),
    ),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Instalar app' }));
  expect(prompt).toHaveBeenCalledOnce();
  expect(screen.getByRole('status')).toHaveTextContent(
    'Datos sin conexión pendientes.',
  );
  expect(screen.getByRole('button', { name: 'Reintentar' })).toBeVisible();
});

it('shows manual installation instructions when downloading fails without a native prompt', () => {
  state.query = {
    ...state.query,
    isFetching: false,
    isPending: false,
    isError: true,
  };
  render(tree());
  expect(screen.getByText(/añadir a pantalla de inicio/i)).toBeVisible();
  expect(screen.getByRole('button', { name: 'Reintentar' })).toBeVisible();
});

it('shows manual installation instructions only after preparation', () => {
  const { rerender } = render(tree());
  const hint = /añadir a pantalla de inicio/i;
  expect(screen.queryByText(hint)).not.toBeInTheDocument();

  state.query = { ...state.query, isFetching: false, isPending: false };
  rerender(tree());
  expect(screen.getByText(hint)).toBeVisible();

  act(() => window.dispatchEvent(new Event('appinstalled')));
  expect(screen.queryByText(hint)).not.toBeInTheDocument();
});

it('hides installation instructions in the installed app', () => {
  mockDisplayMode(true);
  state.query = { ...state.query, isFetching: false, isPending: false };
  render(tree());
  expect(screen.getByRole('status')).toHaveTextContent('Pases listos');
  expect(
    screen.queryByText(/añadir a pantalla de inicio/i),
  ).not.toBeInTheDocument();
});
