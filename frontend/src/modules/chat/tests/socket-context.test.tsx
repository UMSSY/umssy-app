import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SocketProvider, useSocket } from '../contexts/socket-context';
import * as accessTokenStorage from '@/shared/services/storage/access-token-storage';

// Mock de socket.io-client
vi.mock('socket.io-client', () => {
  return {
    io: vi.fn(() => ({
      on: vi.fn(),
      disconnect: vi.fn(),
      connected: true,
    })),
  };
});

// Mock del router de Next.js
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Componente de prueba que consume el contexto
const TestConsumer = () => {
  const { isConnected, socket } = useSocket();
  return (
    <div>
      <span data-testid="status">{isConnected ? 'Conectado' : 'Desconectado'}</span>
      <span data-testid="has-socket">{socket ? 'Sí' : 'No'}</span>
    </div>
  );
};

describe('SocketProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe conectarse si hay un token disponible', async () => {
    // Simulamos que hay un token
    vi.spyOn(accessTokenStorage, 'getAccessToken').mockReturnValue('fake-token');

    render(
      <SocketProvider>
        <TestConsumer />
      </SocketProvider>
    );

    // Verificamos que el socket se haya instanciado (nuestro mock dice que connected = true)
    await waitFor(() => {
      expect(screen.getByTestId('has-socket')).toHaveTextContent('Sí');
    });
  });

  it('no debe conectarse si no hay token', async () => {
    // Simulamos que NO hay token
    vi.spyOn(accessTokenStorage, 'getAccessToken').mockReturnValue(null);

    render(
      <SocketProvider>
        <TestConsumer />
      </SocketProvider>
    );

    // Como no hay token, el socket nunca se crea
    expect(screen.getByTestId('has-socket')).toHaveTextContent('No');
    expect(screen.getByTestId('status')).toHaveTextContent('Desconectado');
  });
});