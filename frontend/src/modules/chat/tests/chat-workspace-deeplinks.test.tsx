import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatWorkspace } from '../components/chat-workspace';
import { MessagingUiProvider, useMessagingUi } from '../contexts/messaging-ui-context';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('../services/chat-api', () => ({
  getCurrentSessionUserId: vi.fn(() => 'user-1'),
  sendAttachmentMessage: vi.fn(),
  blockUser: vi.fn(),
  unblockUser: vi.fn(),
}));

const mockHandleSelectConversation = vi.fn();
const mockClearSelectedConversation = vi.fn();
const mockConversationState = vi.hoisted(() => ({
  hasListError: false,
  hasSelectedConversation: false,
}));

vi.mock('../hooks/use-conversations', () => ({
  useConversations: vi.fn(() => ({
    conversations: [
      {
        id: 'conv-1',
        contact: { id: 'user-2', fullName: 'Test Contact' },
        updatedAt: '2026-11-15T00:00:00Z',
      },
    ],
    selectedConversation: mockConversationState.hasSelectedConversation
      ? {
          id: 'conv-1',
          contact: { id: 'user-2', fullName: 'Test Contact' },
          contextType: 'POSTULACION',
          contextId: 'application-1',
          lastMessage: null,
          unreadCount: 0,
          updatedAt: '2026-11-15T00:00:00Z',
        }
      : null,
    hasMore: false,
    loadMore: vi.fn(),
    selectedId: mockConversationState.hasSelectedConversation ? 'conv-1' : null,
    activeFilter: 'all',
    searchQuery: '',
    isLoading: false,
    isError: mockConversationState.hasListError,
    retryConversations: vi.fn(),
    setActiveFilter: vi.fn(),
    setSearchQuery: vi.fn(),
    handleSelectConversation: mockHandleSelectConversation,
    clearSelectedConversation: mockClearSelectedConversation,
    findExistingConversationByContact: vi.fn(),
    startConversationWithContact: vi.fn(),
    openContextualConversation: vi.fn(),
    updateConversationLastMessage: vi.fn(),
    setConversationBlocked: vi.fn(),
  })),
}));

vi.mock('@/shared/contexts/auth-context', () => ({
  useAuth: () => ({ roles: ['titulado'], isLoading: false }),
}));

vi.mock('../hooks/use-received-connection-requests', () => ({
  useReceivedConnectionRequests: vi.fn(() => ({
    data: [
      {
        id: 'req-1',
        sender: { id: 'user-3', firstName: 'Maria', lastName: 'Perez' },
        status: { title: 'PENDING' },
        createdAt: '2026-11-15T00:00:00Z',
      },
    ],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })),
}));

vi.mock('../hooks/use-send-connection-request', () => ({
  useSendConnectionRequest: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('../hooks/use-respond-connection-request', () => ({
  useRespondConnectionRequest: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('../hooks/use-accepted-connections', () => ({
  useAcceptedConnections: vi.fn(() => ({
    refetch: vi.fn(),
  })),
}));

vi.mock('../hooks/use-messages', () => ({
  useMessages: vi.fn(() => ({
    data: [],
    isLoading: false,
    hasMoreMessages: false,
    loadMoreMessages: vi.fn(),
    isLoadingMoreMessages: false,
    isError: false,
    isFetchNextPageError: false,
    refetch: vi.fn(),
  })),
}));

vi.mock('../hooks/use-chat-connection', () => ({
  useChatConnection: vi.fn(() => ({
    status: 'connected',
    refreshMessages: vi.fn(),
  })),
}));

vi.mock('../services/chat-socket', () => ({
  getChatSocket: vi.fn(() => ({
    connected: true,
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  })),
}));

describe('ChatWorkspace Deep Links (HU-20)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConversationState.hasListError = false;
    mockConversationState.hasSelectedConversation = false;
    queryClient = new QueryClient();
    window.history.pushState({}, '', '/chat');
  });

  it('selects conversation when conversationId query param matches', async () => {
    window.history.pushState({}, '', '/chat?conversationId=conv-1');

    render(
      <QueryClientProvider client={queryClient}>
        <ChatWorkspace />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(mockHandleSelectConversation).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'conv-1' }),
      );
    });
  });

  it('shows toast error when conversationId is not found', async () => {
    window.history.pushState({}, '', '/chat?conversationId=conv-999');

    render(
      <QueryClientProvider client={queryClient}>
        <ChatWorkspace />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Conversación no encontrada o sin acceso.',
      );
    });
  });

  it('opens request detail when tab=requests query param is present', async () => {
    window.history.pushState({}, '', '/chat?tab=requests');

    render(
      <QueryClientProvider client={queryClient}>
        <ChatWorkspace />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(mockClearSelectedConversation).toHaveBeenCalled();
      // Should show connection request detail
      expect(screen.getByText('Solicitud de conexión')).toBeInTheDocument();
    });
  });

  it('does not show the conversation-list error over an opened application chat', () => {
    mockConversationState.hasListError = true;
    mockConversationState.hasSelectedConversation = true;

    render(
      <QueryClientProvider client={queryClient}>
        <ChatWorkspace />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('message-textarea')).toBeInTheDocument();
    expect(screen.queryByText('Error de conexión')).not.toBeInTheDocument();
  });

  it('closes the panel on back when another screen opened the chat', () => {
    mockConversationState.hasSelectedConversation = true;
    function OpenFromLauncher() {
      const ui = useMessagingUi();
      return (
        <>
          <Button
            type="button"
            onClick={() => {
              ui?.setLauncherId('contact-button');
              ui?.setIsPanelOpen(true);
            }}
          >
            Abrir desde otra pantalla
          </Button>
          <span data-testid="panel-state">{ui?.isPanelOpen ? 'open' : 'closed'}</span>
        </>
      );
    }

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MessagingUiProvider>
          <OpenFromLauncher />
          <ChatWorkspace isCompact />
        </MessagingUiProvider>
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir desde otra pantalla' }));
    expect(screen.getByTestId('panel-state')).toHaveTextContent('open');
    fireEvent.click(within(container).getByTestId('chat-back-button'));
    expect(screen.getByTestId('panel-state')).toHaveTextContent('closed');
    expect(mockClearSelectedConversation).not.toHaveBeenCalled();
  });

  it('goes back to the list when the chat was not opened from another screen', () => {
    mockConversationState.hasSelectedConversation = true;

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MessagingUiProvider>
          <ChatWorkspace isCompact />
        </MessagingUiProvider>
      </QueryClientProvider>,
    );

    fireEvent.click(within(container).getByTestId('chat-back-button'));
    expect(mockClearSelectedConversation).toHaveBeenCalled();
  });
});
