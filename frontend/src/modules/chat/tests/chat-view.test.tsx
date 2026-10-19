
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

import { ChatView } from '../views/chat-view';
import ChatPage from '@/app/(app)/chat/page';
import AppLayout from '@/app/(app)/layout';
import { stubMatchMedia } from '@/shared/testing/stub-match-media';
import * as chatApi from '../services/chat-api';

vi.mock('next/navigation', () => ({
  usePathname: () => '/chat',
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

vi.mock('@/modules/auth', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/modules/auth')>();

  return {
    ...actual,
    SessionUserCard: () => null,
  };
});

const mockList = [
  {
    id: 'conv-1',
    contact: {
      id: 'u1',
      fullName: 'Maria Fernandez',
      avatarUrl: 'https://example.com/a.jpg',
      isOnline: true,
    },
    lastMessage: {
      id: 'm1',
      senderId: 'u1',
      content: 'Hola',
      isAttachment: false,
      createdAt: new Date().toISOString(),
    },
    unreadCount: 1,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conv-2',
    contact: {
      id: 'u2',
      fullName: 'Carlos Ramos',
      avatarUrl: null,
      isOnline: false,
    },
    lastMessage: null,
    unreadCount: 0,
    updatedAt: new Date().toISOString(),
  },
];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

const renderWithQueryClient = (ui: React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
  );
};

describe('ChatView & ChatPage', () => {
  it(
    'debe renderizar ChatView con estado vacio y permitir seleccionar conversacion',
    async () => {
      vi.spyOn(
        chatApi,
        'getConversations',
      ).mockResolvedValue(mockList);

      renderWithQueryClient(<ChatView />);

      expect(
        await screen.findByText('Maria Fernandez'),
      ).toBeDefined();

      expect(
        screen.getByText(/Selecciona una conversacion/i),
      ).toBeDefined();

      // Abrir el modal de nueva conversación.
      const newChatButtons = screen.getAllByText(
        'Iniciar una nueva conversacion',
      );

      fireEvent.click(newChatButtons[0]);

      expect(
        await screen.findByText(/Nueva conversación/i),
      ).toBeDefined();

      // Cerrar el modal para continuar con la lista.
      fireEvent.keyDown(document, {
        key: 'Escape',
        code: 'Escape',
      });

      await waitFor(() => {
        expect(
          screen.queryByText(/Nueva conversación/i),
        ).toBeNull();
      });

      // Seleccionar la conversación.
      fireEvent.click(
        screen.getByText('Maria Fernandez'),
      );

      // Verificar el nombre del contacto en la cabecera.
      expect(
        await screen.findByTestId('chat-contact-name'),
      ).toHaveTextContent('Maria Fernandez');

      // Verificar que el contacto está conectado.
     expect(
  screen.getByText(/En línea/i),
).toBeDefined();

      // Volver a la lista de conversaciones.
      const backButton = screen.getByLabelText(
        'Volver a la lista de chats',
      );

      fireEvent.click(backButton);

      expect(
        screen.getByText(/Selecciona una conversacion/i),
      ).toBeDefined();
    },
  );

  it(
    'debe renderizar la conversacion seleccionada sin foto mostrando desconectado',
    async () => {
      vi.spyOn(
        chatApi,
        'getConversations',
      ).mockResolvedValue(mockList);

      renderWithQueryClient(<ChatView />);

      expect(
        await screen.findByText('Carlos Ramos'),
      ).toBeDefined();

      fireEvent.click(
        screen.getByText('Carlos Ramos'),
      );

      // Verificar el nombre del contacto seleccionado.
      expect(
        await screen.findByTestId('chat-contact-name'),
      ).toHaveTextContent('Carlos Ramos');

      // Verificar que el contacto está desconectado.
      expect(
        screen.getByText('Desconectado'),
      ).toBeDefined();
    },
  );

  it(
    'debe conmutar de unread a all y abrir modal al pulsar nueva conversacion',
    async () => {
      vi.spyOn(
        chatApi,
        'getConversations',
      ).mockResolvedValue(mockList);

      renderWithQueryClient(<ChatView />);

      expect(
        await screen.findByText('Maria Fernandez'),
      ).toBeDefined();

      // Activar el filtro de conversaciones sin leer.
      const unreadTab = screen.getByText('Sin leer');

      fireEvent.click(unreadTab);

      // Abrir el modal de nueva conversación.
      const newBtn = screen.getByText(
        'Iniciar una nueva conversacion',
      );

      fireEvent.click(newBtn);

      expect(
        await screen.findByText(/Nueva conversación/i),
      ).toBeDefined();
    },
  );

  it(
    'renders the chat page inside one app navigation',
    async () => {
      stubMatchMedia();

      sessionStorage.setItem(
        'accessToken',
        `h.${btoa(
          JSON.stringify({
            roleTag: 'titulado',
          }),
        )}.s`,
      );

      vi.spyOn(
        chatApi,
        'getConversations',
      ).mockResolvedValue(mockList);

      renderWithQueryClient(
        <AppLayout>
          <ChatPage />
        </AppLayout>,
      );

      expect(
        screen.getByText('Chats'),
      ).toBeDefined();

      expect(
        screen.getAllByRole('navigation', {
          name: 'Menú principal',
        }),
      ).toHaveLength(1);

      expect(
        screen.getByRole('link', {
          name: 'Chat',
        }),
      ).toHaveAttribute('href', '/chat');

      expect(
        await screen.findByText('Maria Fernandez'),
      ).toBeDefined();
    },
  );
});
