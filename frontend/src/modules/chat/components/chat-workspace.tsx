
"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useMessagingUi } from "../contexts/messaging-ui-context";

import type { ChatWorkspaceProps } from "../types/chat-workspace-props.types";
import type { Conversation } from "../types/conversation.types";
import type { ConnectionRequest } from "../types/connection-request.types";
import type { User } from "../types/user.types";

import { useConversations } from "../hooks/use-conversations";
import { useMessages, messagesQueryKey } from "../hooks/use-messages";
import { useSendConnectionRequest } from "../hooks/use-send-connection-request";
import { useReceivedConnectionRequests } from "../hooks/use-received-connection-requests";

import { ConversationList } from "./conversation-list";
import { ConnectionRequestDetail } from "./connection-request-detail";
import { EmptyChatState } from "./empty-chat-state";
import { ContactSearchModal } from "./contact-search-modal";
import { ChatRoom } from "./chat-room";
import { ChatConnectionDialog } from "./chat-connection-dialog";
import { ChatErrorState } from "./chat-error-state";
import { SendConnectionRequestDialog } from "./send-connection-request-dialog";

import {
  sendMessage,
  getCurrentSessionUserId,
} from "../services/chat-api";

export function ChatWorkspace({
  isCompact = false,
}: ChatWorkspaceProps) {
  const currentUserId = getCurrentSessionUserId();

  const [isSearchModalOpen, setIsSearchModalOpen] =
    useState(false);

  const [
    selectedContactForRequest,
    setSelectedContactForRequest,
  ] = useState<User | null>(null);

  const [selectedRequestId, setSelectedRequestId] =
    useState<string | null>(null);

  const [requestError, setRequestError] =
    useState<string | null>(null);

  const [requestSuccess, setRequestSuccess] =
    useState<string | null>(null);

  const [isSendingLocally, setIsSendingLocally] =
    useState(false);

  const [dismissedError, setDismissedError] =
    useState(false);

  const ui = useMessagingUi();

  const isSending = ui?.isSending ?? isSendingLocally;
  const setIsSending =
    ui?.setIsSending ?? setIsSendingLocally;

  const queryClient = useQueryClient();
  const sendRequestMutation = useSendConnectionRequest();

  const {
    data: receivedRequests = [],
    isLoading: isLoadingRequests,
    isError: isRequestsError,
    refetch: retryRequests,
  } = useReceivedConnectionRequests();

  const {
    conversations,
    selectedConversation,
    hasMore,
    loadMore,
    selectedId,
    activeFilter,
    searchQuery,
    isLoading,
    isError,
    retryConversations,
    setActiveFilter,
    setSearchQuery,
    handleSelectConversation,
    clearSelectedConversation,
    findExistingConversationByContact,
    updateConversationLastMessage,
  } = useConversations();

  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    hasMoreMessages,
    loadMoreMessages,
    isLoadingMoreMessages,
    isError: isMessagesError,
    isFetchNextPageError,
    refetch: retryMessages,
  } = useMessages(selectedRequestId ? null : selectedId);

  const selectedRequest =
    receivedRequests.find(
      (request) => request.id === selectedRequestId,
    ) ?? null;

  const hasSelectedItem = Boolean(
    selectedRequest || selectedId,
  );

  const showConnectionDialog =
    isError && !dismissedError;

  const handleBackToList = () => {
    setSelectedRequestId(null);
    clearSelectedConversation();
  };

  const handleSelectChat = (conversation: Conversation) => {
    setSelectedRequestId(null);
    handleSelectConversation(conversation);
  };

  const handleSelectRequest = (
    request: ConnectionRequest,
  ) => {
    clearSelectedConversation();
    setSelectedRequestId(request.id);
  };

  const handleStartNewChat = () => {
    if (activeFilter !== "all") {
      setActiveFilter("all");
    }

    setRequestSuccess(null);
    setIsSearchModalOpen(true);
  };

  const handleStartChatWithContact = (
    contactUser: User,
  ) => {
    if (activeFilter !== "all") {
      setActiveFilter("all");
    }

    setIsSearchModalOpen(false);
    setRequestError(null);
    setRequestSuccess(null);

    const existingConversation =
      findExistingConversationByContact(contactUser.id);

    if (existingConversation) {
      handleSelectChat(existingConversation);
      return;
    }

    setSelectedContactForRequest(contactUser);
  };

  const handleSendConnectionRequest = async () => {
    if (
      !selectedContactForRequest ||
      sendRequestMutation.isPending
    ) {
      return;
    }

    const contact = selectedContactForRequest;
    setRequestError(null);

    try {
      await sendRequestMutation.mutateAsync(contact.id);

      setSelectedContactForRequest(null);

      setRequestSuccess(
        `Solicitud de conexión enviada a ${contact.fullName}.`,
      );
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "No se pudo enviar la solicitud de conexión.",
      );
    }
  };

  const handleCloseRequestDialog = () => {
    if (sendRequestMutation.isPending) {
      return;
    }

    setSelectedContactForRequest(null);
    setRequestError(null);
  };

  const handleSendMessage = async (
    content: string,
  ): Promise<void> => {
    if (!selectedId || selectedRequestId || isSending) {
      throw new Error(
        "No hay una conversación seleccionada o ya se está enviando un mensaje.",
      );
    }

    const conversationId = selectedId;
    setIsSending(true);

    try {
      await sendMessage({
        conversationId,
        content,
        senderId: currentUserId,
      });

      updateConversationLastMessage(
        conversationId,
        content,
        currentUserId,
      );

      await queryClient.invalidateQueries({
        queryKey: messagesQueryKey(conversationId),
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleRetryConversations = async () => {
    setDismissedError(true);

    try {
      await retryConversations();
    } finally {
      setDismissedError(false);
    }
  };

  return (
    <div className="relative flex size-full min-h-0 max-w-full flex-1 overflow-hidden bg-surface-soft font-sans">
      <aside
        className={cn(
          "h-full shrink-0 overflow-hidden",
          isCompact ? "w-full" : "w-80",
          hasSelectedItem
            ? isCompact
              ? "hidden"
              : "hidden md:block"
            : "block",
        )}
      >
        {isCompact && isError ? (
          <ChatErrorState
            message="No pudimos cargar tus conversaciones."
            onRetry={() => {
              void handleRetryConversations();
            }}
          />
        ) : (
          <ConversationList
            conversations={conversations}
            connectionRequests={receivedRequests}
            selectedId={selectedId}
            selectedRequestId={selectedRequestId}
            isLoading={isLoading}
            isError={isError}
            isLoadingRequests={isLoadingRequests}
            isRequestsError={isRequestsError}
            onRetryRequests={() => {
              void retryRequests();
            }}
            hasMore={hasMore}
            activeFilter={activeFilter}
            searchQuery={searchQuery}
            onSelectConversation={handleSelectChat}
            onSelectRequest={handleSelectRequest}
            onFilterChange={setActiveFilter}
            onSearchChange={setSearchQuery}
            onLoadMore={loadMore}
            onStartNewChat={handleStartNewChat}
          />
        )}
      </aside>

      <main
        className={cn(
          "h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-surface",
          hasSelectedItem
            ? "flex"
            : isCompact
              ? "hidden"
              : "hidden md:flex",
        )}
      >
        {selectedRequest ? (
          <ConnectionRequestDetail
            request={selectedRequest}
            onBack={handleBackToList}
          />
        ) : selectedConversation ? (
          <ChatRoom
            isCompact={isCompact}
            key={selectedConversation.id}
            conversation={selectedConversation}
            messages={messages}
            currentUserId={currentUserId}
            onBack={handleBackToList}
            onSendMessage={handleSendMessage}
            isLoadingMessages={isLoadingMessages}
            isSending={isSending}
            hasMoreMessages={hasMoreMessages}
            onLoadMoreMessages={loadMoreMessages}
            isLoadingMoreMessages={isLoadingMoreMessages}
            isMessagesError={isMessagesError}
            isLoadingOlderError={isFetchNextPageError}
            onRetryMessages={() => {
              void retryMessages();
            }}
          />
        ) : (
          <EmptyChatState
            description="Selecciona una conversación existente en el panel izquierdo o inicia una nueva para comenzar a comunicarte."
            actionLabel="Iniciar una nueva conversación"
            onAction={handleStartNewChat}
          />
        )}
      </main>

      <ChatConnectionDialog
        open={!isCompact && showConnectionDialog}
        onClose={() => setDismissedError(true)}
        onRetry={() => {
          void handleRetryConversations();
        }}
      />

      <ContactSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectContact={handleStartChatWithContact}
      />

      <SendConnectionRequestDialog
        contact={selectedContactForRequest}
        isSending={sendRequestMutation.isPending}
        error={requestError}
        onConfirm={() => {
          void handleSendConnectionRequest();
        }}
        onClose={handleCloseRequestDialog}
      />

      {requestSuccess && (
        <div
          role="status"
          className="absolute right-4 bottom-4 z-50 max-w-sm rounded-lg border border-border bg-surface p-4 text-sm text-ink shadow-lg"
        >
          <p>{requestSuccess}</p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => setRequestSuccess(null)}
          >
            Cerrar
          </Button>
        </div>
      )}
    </div>
  );
}
