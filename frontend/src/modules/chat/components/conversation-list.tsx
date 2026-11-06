
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

import type {
  Conversation,
  ConversationFilter,
} from "../types/conversation.types";
import type { ConnectionRequest } from "../types/connection-request.types";

import { ConversationItem } from "./conversation-item";
import { ConnectionRequestItem } from "./connection-request-item";
import { ConversationSkeleton } from "./conversation-skeleton";
import { EmptyChatState } from "./empty-chat-state";

interface ConversationListProps {
  conversations: Conversation[];
  connectionRequests?: ConnectionRequest[];
  selectedId?: string | null;
  selectedRequestId?: string | null;
  isLoading: boolean;
  isError?: boolean;
  isLoadingRequests?: boolean;
  isRequestsError?: boolean;
  onRetryRequests?: () => void;
  hasMore: boolean;
  activeFilter: ConversationFilter;
  searchQuery: string;
  onSelectConversation: (conversation: Conversation) => void;
  onSelectRequest?: (request: ConnectionRequest) => void;
  onFilterChange: (filter: ConversationFilter) => void;
  onSearchChange: (query: string) => void;
  onLoadMore?: () => void;
  onStartNewChat?: () => void;
}

type ChatListEntry =
  | {
      type: "conversation";
      id: string;
      date: string;
      conversation: Conversation;
    }
  | {
      type: "request";
      id: string;
      date: string;
      request: ConnectionRequest;
    };

function getSenderName(request: ConnectionRequest): string {
  if (!request.sender) return "";

  return `${request.sender.firstName} ${request.sender.lastName}`
    .trim();
}

export function ConversationList({
  conversations,
  connectionRequests = [],
  selectedId,
  selectedRequestId,
  isLoading,
  isError = false,
  isLoadingRequests = false,
  isRequestsError = false,
  onRetryRequests,
  hasMore,
  activeFilter,
  searchQuery,
  onSelectConversation,
  onSelectRequest,
  onFilterChange,
  onSearchChange,
  onLoadMore,
  onStartNewChat,
}: ConversationListProps) {
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase();

  const visibleRequests = connectionRequests.filter((request) => {
    if (request.status?.title !== "PENDING") {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return getSenderName(request)
      .toLocaleLowerCase()
      .includes(normalizedSearch);
  });

  const entries: ChatListEntry[] = [
    ...conversations.map(
      (conversation): ChatListEntry => ({
        type: "conversation",
        id: conversation.id,
        date: conversation.updatedAt,
        conversation,
      }),
    ),
    ...visibleRequests.map(
      (request): ChatListEntry => ({
        type: "request",
        id: request.id,
        date: request.createdAt,
        request,
      }),
    ),
  ].sort(
    (a, b) =>
      new Date(b.date).getTime() -
      new Date(a.date).getTime(),
  );

  const isFiltered = Boolean(
    normalizedSearch || activeFilter === "unread",
  );

  const getEmptyMessage = () => {
    if (normalizedSearch) {
      return "No se encontraron conversaciones ni solicitudes que coincidan con tu búsqueda.";
    }

    if (activeFilter === "unread") {
      return "No tienes mensajes ni solicitudes pendientes.";
    }

    return "Aún no tienes conversaciones ni solicitudes registradas.";
  };

  return (
    <div className="relative flex h-full flex-col border-r border-border bg-surface">
      <div className="space-y-3 border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-ink">
            Chats
          </h2>

          {onStartNewChat && activeFilter !== "unread" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onStartNewChat}
              className="hidden items-center gap-1.5 text-sm font-bold text-accent hover:text-accent md:inline-flex"
            >
              <Plus className="size-4" aria-hidden="true" />
              Nuevo
            </Button>
          )}
        </div>

        <div className="relative">
          <Input
            type="text"
            value={searchQuery}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
            aria-label="Buscar conversaciones"
            placeholder="Buscar personas..."
            className="w-full rounded-lg border border-border bg-surface py-2 pr-3 pl-9 text-sm text-ink placeholder:text-text-secondary focus:border-accent focus-visible:ring-2 focus-visible:ring-ring"
          />

          <Search
            className="pointer-events-none absolute top-3 left-3 size-4 text-text-secondary"
            aria-hidden="true"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onFilterChange("all")}
            aria-pressed={activeFilter === "all"}
            className={`rounded-md px-3.5 py-1 text-xs font-semibold ${
              activeFilter === "all"
                ? "bg-interaction text-accent"
                : "bg-surface text-text-secondary hover:bg-surface-soft"
            }`}
          >
            Todos
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onFilterChange("unread")}
            aria-pressed={activeFilter === "unread"}
            className={`rounded-md px-3.5 py-1 text-xs font-semibold ${
              activeFilter === "unread"
                ? "bg-interaction text-accent"
                : "bg-surface text-text-secondary hover:bg-surface-soft"
            }`}
          >
            Sin leer
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div
            role="status"
            aria-label="Cargando conversaciones"
          >
            <span className="sr-only">
              Cargando conversaciones...
            </span>
            <ConversationSkeleton />
          </div>
        ) : isError ? null : (
          <>
            {isLoadingRequests && (
              <p
                role="status"
                className="p-3 text-center text-xs text-text-secondary"
              >
                Cargando solicitudes...
              </p>
            )}

            {isRequestsError && (
              <div
                role="alert"
                className="space-y-2 border-b border-border p-3 text-center"
              >
                <p className="text-xs text-text-secondary">
                  No se pudieron cargar las solicitudes.
                </p>

                {onRetryRequests && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onRetryRequests}
                  >
                    Reintentar
                  </Button>
                )}
              </div>
            )}

            {entries.length === 0 &&
            !isLoadingRequests &&
            !isRequestsError ? (
              <EmptyChatState
                description={getEmptyMessage()}
                actionLabel="Iniciar una nueva conversación"
                onAction={
                  isFiltered ? undefined : onStartNewChat
                }
              />
            ) : (
              <div className="divide-y divide-border">
                {entries.map((entry) =>
                  entry.type === "request" ? (
                    <ConnectionRequestItem
                      key={`request-${entry.id}`}
                      request={entry.request}
                      isSelected={
                        selectedRequestId === entry.id
                      }
                      onSelect={(request) =>
                        onSelectRequest?.(request)
                      }
                    />
                  ) : (
                    <ConversationItem
                      key={`conversation-${entry.id}`}
                      conversation={entry.conversation}
                      isSelected={
                        !selectedRequestId &&
                        selectedId === entry.id
                      }
                      onSelect={onSelectConversation}
                    />
                  ),
                )}

                {hasMore && (
                  <div className="p-3 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={onLoadMore}
                      disabled={!onLoadMore}
                      className="text-xs font-semibold text-ink-soft"
                    >
                      Cargar más conversaciones
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {onStartNewChat && activeFilter !== "unread" && (
        <Button
          type="button"
          variant="default"
          size="icon-lg"
          onClick={onStartNewChat}
          className="absolute right-4 bottom-6 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-none hover:bg-brand-hover md:hidden"
          aria-label="Iniciar nueva conversación"
        >
          <Plus className="size-6" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
