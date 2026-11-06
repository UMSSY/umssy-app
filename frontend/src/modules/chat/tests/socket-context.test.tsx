
import React from 'react';
import { render, screen, cleanup, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { SocketProvider, useSocket } from '../contexts/socket-context';
import * as accessTokenStorage from '@/shared/services/storage/access-token-storage';

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn(),
    connected: true,
  })),
}));

const TestConsumer = () => {
  const { isConnected, socket } = useSocket();

  return (
    <div>
      <span data-testid="status">
        {isConnected ? 'Conectado' : 'Desconectado'}
      </span>
      <span data-testid="has-socket">
        {socket ? 'Sí' : 'No'}
      </span>
    </div>
  );
};

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <TestConsumer />
      </SocketProvider>
    </QueryClientProvider>,
  );
}

describe('SocketProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('debe conectarse si hay un token disponible', async () => {
    vi.spyOn(accessTokenStorage, 'getAccessToken').mockReturnValue('fake-token');

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId('has-socket')).toHaveTextContent('Sí');
    });
  });

  it('no debe conectarse si no hay token', () => {
    vi.spyOn(accessTokenStorage, 'getAccessToken').mockReturnValue(null);

    renderWithProviders();

    expect(screen.getByTestId('has-socket')).toHaveTextContent('No');
    expect(screen.getByTestId('status')).toHaveTextContent('Desconectado');
  });

  it('inicia la conexión tras login y la elimina al cerrar sesión', async () => {
    const token = vi
      .spyOn(accessTokenStorage, 'getAccessToken')
      .mockReturnValue(null);

    renderWithProviders();

    expect(screen.getByTestId('has-socket')).toHaveTextContent('No');

    token.mockReturnValue('login-token');

    act(() => {
      window.dispatchEvent(new Event('access-token-change'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('has-socket')).toHaveTextContent('Sí');
    });

    token.mockReturnValue(null);

    act(() => {
      window.dispatchEvent(new Event('access-token-change'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('has-socket')).toHaveTextContent('No');
    });

    expect(screen.getByTestId('status')).toHaveTextContent('Desconectado');
  });
});
