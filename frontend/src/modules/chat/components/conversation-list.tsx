
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from 'lucide-react';
import { Conversation, ConversationFilter } from '../types/conversation.types';
import { ConversationItem } from './conversation-item';
import { ConversationSkeleton } from './conversation-skeleton';
import { EmptyChatState } from './empty-chat-state';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string | null;
  isLoading: boolean;
  isError?: boolean;
  hasMore: boolean;
  activeFilter: ConversationFilter;
  searchQuery: string;
  onSelectConversation: (conversation: Conversation) => void;
  onFilterChange: (filter: ConversationFilter) => void;
  onSearchChange: (query: string) => void;
  onLoadMore?: () => void;
  onStartNewChat?: () => void;
}

export function ConversationList({
  conversations,
  selectedId,
  isLoading,
  isError = false,
  hasMore,
  activeFilter,
  searchQuery,
  onSelectConversation,
  onFilterChange,
  onSearchChange,
  onLoadMore,
  onStartNewChat,
}: ConversationListProps) {
  const isFiltered = Boolean(searchQuery.trim() || activeFilter === 'unread');

  const getEmptyMessage = () => {
    if (activeFilter === 'unread') {
      return 'No tienes mensajes sin leer.';
    }
    if (searchQuery.trim().length > 0) {
      return 'No se encontraron conversaciones que coincidan con tu busqueda.';
    }
    return 'Aun no tienes ninguna conversacion registrada.';
  };

  return (
    <div className="relative flex h-full flex-col border-r border-border bg-surface">
      <div className="space-y-3 border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-ink">Chats</h2>
          {onStartNewChat && activeFilter !== 'unread' && (
            <Button variant="ghost"
              type="button"
              onClick={onStartNewChat}
              className="hidden items-center gap-1.5 text-sm font-bold text-accent hover:text-accent md:inline-flex"
            >
              <Plus className="size-4" aria-hidden="true" /> Nuevo
            </Button>
          )}
        </div>

        <div className="relative">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Buscar conversaciones"
            placeholder="Buscar personas..."
            className="w-full rounded-lg border border-border bg-surface py-2 pr-3 pl-9 text-sm text-ink transition-all placeholder:text-text-secondary focus:border-accent focus:bg-surface focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Search className="pointer-events-none absolute top-3 left-3 size-4 text-text-secondary" aria-hidden="true" />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button variant="ghost"
            type="button"
            onClick={() => onFilterChange('all')}
            className={`rounded-md px-3.5 py-1 text-xs font-semibold transition-colors ${
              activeFilter === 'all'
                ? 'bg-interaction text-accent'
                : 'bg-surface text-text-secondary hover:bg-surface-soft'
            }`}
          >
            Todos
          </Button>
          <Button variant="ghost"
            type="button"
            onClick={() => onFilterChange('unread')}
            className={`rounded-md px-3.5 py-1 text-xs font-semibold transition-colors ${
              activeFilter === 'unread'
                ? 'bg-interaction text-accent'
                : 'bg-surface text-text-secondary hover:bg-surface-soft'
            }`}
          >
            Sin leer
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div role="status" aria-label="Cargando conversaciones">
            <span className="sr-only">Cargando conversaciones...</span>
            <ConversationSkeleton />
          </div>
        ) : isError ? null : conversations.length === 0 ? (
          <EmptyChatState
            description={getEmptyMessage()}
            actionLabel="Iniciar una nueva conversacion"
            onAction={isFiltered ? undefined : onStartNewChat}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {conversations.map((item) => (
              <ConversationItem
                key={item.id}
                conversation={item}
                isSelected={selectedId === item.id}
                onSelect={onSelectConversation}
              />
            ))}

            {hasMore && (
              <div className="p-3 text-center">
                <Button variant="ghost"
                  type="button"
                  onClick={onLoadMore}
                  className="text-xs font-semibold text-ink-soft hover:text-ink-soft"
                >
                  Cargar mas conversaciones
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {onStartNewChat && activeFilter !== 'unread' && (
        <Button variant="ghost"
          type="button"
          onClick={onStartNewChat}
          className="absolute right-4 bottom-6 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-none transition-all hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-ring active:scale-95 md:hidden"
          aria-label="Iniciar nueva conversacion"
        >
          <Plus className="size-6" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
