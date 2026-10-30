"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import Image from "next/image";
import { ArrowLeft, Lock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Conversation, Message } from "../types/conversation.types";
import type { MessageAttachment } from "../types/attachment.types";
import { MessageInputBar } from "./message-input-bar";
import { MessageItem } from "./message-item";
import { ContactProfileModal } from "./contact-profile-modal";
import { ChatErrorState } from "./chat-error-state";
import { getInitials } from "../utils/date-formatter";
import { isContentValidForSend } from "../utils/unicode-counter";
import { useMessagingUi } from "../contexts/messaging-ui-context";
import { ChatOptionsMenu } from "./chat-options-menu";
import { BlockUserDialog } from "./block-user-dialog";
import { BlockedConversationNotice } from "./blocked-conversation-notice";
import { downloadAttachment } from "../services/chat-api";
import { isApiError } from "@/shared/services/api-client";

import { ChatConnectionBanner } from './chat-connection-banner';
import type { ChatConnectionStatus } from '../types/chat-connection-status.types';

interface ChatRoomProps {
  connectionStatus?: ChatConnectionStatus;
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
  onBack: () => void;
  onSendMessage: (content: string, file?: File | null) => void | Promise<void>;
  isLoadingMessages?: boolean;
  isSending?: boolean;
  hasMoreMessages?: boolean;
  onLoadMoreMessages?: () => void | Promise<unknown>;
  isLoadingMoreMessages?: boolean;
  isMessagesError?: boolean;
  isLoadingOlderError?: boolean;
  onRetryMessages?: () => void;
  isCompact?: boolean;
  onBlockUser?: () => Promise<void>;
  onUnblockUser?: () => Promise<void>;
}

interface ScrollAnchor {
  messageId: string;
  offsetTop: number;
  scrollTop: number;
  scrollHeight: number;
  firstMessageId: string | null;
}

const TOP_THRESHOLD = 80;
const BOTTOM_THRESHOLD = 120;

function getMessageDate(message: Message): string {
  return message.timestamp || message.createdAt || "";
}

function isSameDay(firstDate?: string | null, secondDate?: string | null): boolean {
  if (!firstDate || !secondDate) return false;
  const first = new Date(firstDate);
  const second = new Date(secondDate);
  if (Number.isNaN(first.getTime()) || Number.isNaN(second.getTime())) return false;
  return first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() && first.getDate() === second.getDate();
}

function shouldShowDateSeparator(messages: Message[], index: number, hasMoreMessages: boolean): boolean {
  if (!messages[index]) return false;
  if (index === 0) return !hasMoreMessages;
  return !isSameDay(getMessageDate(messages[index - 1]), getMessageDate(messages[index]));
}

function scrollToBottom(container: HTMLDivElement, behavior: ScrollBehavior = "smooth"): void {
  if (typeof container.scrollTo === "function") {
    container.scrollTo({ top: container.scrollHeight, behavior });
  } else {
    container.scrollTop = container.scrollHeight;
  }
}

export function ChatRoom(props: ChatRoomProps) {
  return <ChatRoomContent key={props.conversation.id} {...props} />;
}

function ChatRoomContent({
  conversation, messages, currentUserId, onBack, onSendMessage,
  isLoadingMessages = false, isSending = false, hasMoreMessages = false,
  onLoadMoreMessages, isLoadingMoreMessages = false, isMessagesError = false,
  isLoadingOlderError = false, onRetryMessages, isCompact = false,
  onBlockUser, onUnblockUser, connectionStatus = "connected",
}: ChatRoomProps) {
  const ui = useMessagingUi();
  const [localInputText, setLocalInputText] = useState("");
  const [selectedAttachment, setSelectedAttachment] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const inputText = ui ? (ui.drafts[conversation.id] ?? "") : localInputText;
  const setInputText = (content: string) => {
    if (ui) ui.setDraft(conversation.id, content);
    else setLocalInputText(content);
  };
  const [sendError, setSendError] = useState(false);
  const [blockedSendError, setBlockedSendError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isUnblocking, setIsUnblocking] = useState(false);
  const [unblockError, setUnblockError] = useState(false);
  const isBlockedByMe = Boolean(conversation.isBlockedByMe);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const anchorRef = useRef<ScrollAnchor | null>(null);
  const loadingOlderRef = useRef(false);
  const sendPendingRef = useRef(false);
  const firstScrollDoneRef = useRef(false);
  const nearBottomRef = useRef(true);
  const scrollAfterSendRef = useRef(false);
  const previousFirstIdRef = useRef<string | null>(null);
  const previousLastIdRef = useRef<string | null>(null);
  const showInitialLoading = isLoadingMessages && messages.length === 0;

  const getMessageElement = useCallback((messageId: string): HTMLElement | null => {
    const container = containerRef.current;
    if (!container) return null;
    for (const element of container.querySelectorAll<HTMLElement>("[data-message-id]")) {
      if (element.dataset.messageId === messageId) return element;
    }
    return null;
  }, []);

  const captureAnchor = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    for (const element of container.querySelectorAll<HTMLElement>("[data-message-id]")) {
      const rect = element.getBoundingClientRect();
      if (rect.bottom > containerRect.top) {
        const messageId = element.dataset.messageId;
        if (!messageId) continue;
        anchorRef.current = {
          messageId, offsetTop: rect.top - containerRect.top,
          scrollTop: container.scrollTop, scrollHeight: container.scrollHeight,
          firstMessageId: previousFirstIdRef.current,
        };
        return;
      }
    }
    anchorRef.current = {
      messageId: "", offsetTop: 0, scrollTop: container.scrollTop,
      scrollHeight: container.scrollHeight, firstMessageId: previousFirstIdRef.current,
    };
  }, []);

  const loadOlderMessages = useCallback(async () => {
    if (!onLoadMoreMessages || !hasMoreMessages || isLoadingMoreMessages || loadingOlderRef.current) return;
    captureAnchor();
    if (!anchorRef.current) return;
    loadingOlderRef.current = true;
    try {
      await onLoadMoreMessages();
    } catch {
      loadingOlderRef.current = false;
      anchorRef.current = null;
    }
  }, [onLoadMoreMessages, hasMoreMessages, isLoadingMoreMessages, captureAnchor]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    nearBottomRef.current = distanceToBottom <= BOTTOM_THRESHOLD;
    if (loadingOlderRef.current) return;
    if (container.scrollTop <= TOP_THRESHOLD && !showInitialLoading && !isMessagesError && hasMoreMessages) {
      void loadOlderMessages();
    }
  };

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || showInitialLoading) return;
    const firstId = messages[0]?.id ?? null;
    const lastId = messages[messages.length - 1]?.id ?? null;
    const previousLastId = previousLastIdRef.current;
    const anchor = anchorRef.current;
    if (loadingOlderRef.current && anchor) {
      const olderMessagesAdded = firstId !== null && firstId !== anchor.firstMessageId;
      if (olderMessagesAdded) {
        const anchorElement = anchor.messageId ? getMessageElement(anchor.messageId) : null;
        if (anchorElement) {
          const currentOffset = anchorElement.getBoundingClientRect().top - container.getBoundingClientRect().top;
          container.scrollTop += currentOffset - anchor.offsetTop;
        } else {
          container.scrollTop = anchor.scrollTop + (container.scrollHeight - anchor.scrollHeight);
        }
        loadingOlderRef.current = false;
        anchorRef.current = null;
      } else if (!isLoadingMoreMessages && !hasMoreMessages) {
        loadingOlderRef.current = false;
        anchorRef.current = null;
      }
    } else if (!firstScrollDoneRef.current && messages.length > 0) {
      scrollToBottom(container, "auto");
      firstScrollDoneRef.current = true;
      nearBottomRef.current = true;
    } else if (lastId !== null && previousLastId !== null && lastId !== previousLastId) {
      if (scrollAfterSendRef.current || nearBottomRef.current) {
        scrollToBottom(container, "smooth");
        scrollAfterSendRef.current = false;
      }
    }
    previousFirstIdRef.current = firstId;
    previousLastIdRef.current = lastId;
  }, [messages, showInitialLoading, isLoadingMoreMessages, hasMoreMessages, getMessageElement]);

  const handleSend = async () => {
    if (connectionStatus !== "connected") return;
    if (isBlockedByMe) return; // con bloqueo activo no se envía nada
    const hasText = isContentValidForSend(inputText);
    const hasAttachment = Boolean(selectedAttachment);
    if ((!hasText && !hasAttachment) || isSending || sendPendingRef.current || isSubmitting || isUploading ||
        showInitialLoading || (isMessagesError && messages.length === 0)) return;
    const content = inputText.trim();
    sendPendingRef.current = true;
    scrollAfterSendRef.current = true;
    setIsSubmitting(true);
    if (selectedAttachment) {
      setIsUploading(true);
    }
    setSendError(false);
    setBlockedSendError(false);
    try {
      if (selectedAttachment) {
        await onSendMessage(content, selectedAttachment);
      } else {
        await onSendMessage(content);
      }
      if (ui) ui.clearSubmittedDraft(conversation.id, inputText);
      else setLocalInputText("");
      setSelectedAttachment(null);
    } catch (error) {
      // 403 del backend (UserBlockedException): el otro usuario bloqueó esta conversación.
      if (isApiError(error) && error.response?.status === 403) setBlockedSendError(true);
      else setSendError(true);
      scrollAfterSendRef.current = false;
      return;
    } finally {
      sendPendingRef.current = false;
      setIsSubmitting(false);
      setIsUploading(false);
    }
    setSendError(false);
    if (containerRef.current) scrollToBottom(containerRef.current, "smooth");
  };

  const handleUnblock = async () => {
    if (!onUnblockUser || isUnblocking) return;
    setIsUnblocking(true);
    setUnblockError(false);
    try {
      await onUnblockUser();
    } catch {
      setUnblockError(true);
    } finally {
      setIsUnblocking(false);
    }
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const handleDownloadAttachment = useCallback(async (attachment: MessageAttachment) => {
    try {
      await downloadAttachment(attachment.id, attachment.fileName);
    } catch {
      // toast de error manejado en el servicio
    }
  }, []);

  return (
    <div data-testid="chat-room" className="flex size-full min-h-0 min-w-0 flex-col overflow-hidden bg-surface-soft">
      <header data-testid="chat-room-header" className="z-10 flex w-full min-w-0 shrink-0 items-center justify-between border-b border-border bg-surface p-3 md:p-4">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" data-testid="chat-back-button"
            onClick={onBack} aria-label="Volver a la lista de chats"
            className={`-ml-1 rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-surface-soft hover:text-ink ${isCompact ? "" : "md:hidden"}`}>
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="default"
            data-testid="chat-contact-profile-trigger"
            title="Ver perfil de usuario"
            aria-label="Ver perfil de usuario"
            onClick={() => setIsProfileModalOpen(true)}
            className="flex h-auto items-center gap-3 p-1 transition-colors hover:bg-surface-soft"
          >
            <div className="relative shrink-0">
              {conversation.contact.avatarUrl ? (
                <Image
                  src={conversation.contact.avatarUrl}
                  alt={conversation.contact.fullName}
                  width={40}
                  height={40}
                  unoptimized
                  className="size-10 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="flex size-10 items-center justify-center rounded-full border border-border bg-border text-xs font-bold text-ink">
                  {getInitials(conversation.contact.fullName)}
                </div>
              )}
              {conversation.contact.isOnline && !isBlockedByMe && (
                <span
                  data-testid="online-indicator"
                  className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-surface bg-emerald-500"
                  title="En línea"
                />
              )}
            </div>
            <div className="text-left">
              <h3
                data-testid="chat-contact-name"
                className="text-sm leading-tight font-bold text-ink md:text-base"
              >
                {conversation.contact.fullName}
              </h3>
              {isBlockedByMe ? (
                <span data-testid="chat-blocked-status" className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft">
                  <Lock className="size-3" aria-hidden="true" />
                  Bloqueado
                </span>
              ) : (
                <span className="text-xs font-medium text-ink-soft">
                  {conversation.contact.isOnline
                    ? "En línea"
                    : "Desconectado"}
                </span>
              )}
            </div>
          </Button>
        </div>
        {onBlockUser && onUnblockUser && (
          <ChatOptionsMenu
            isBlocked={isBlockedByMe}
            disabled={isUnblocking}
            onBlockSelect={() => setIsBlockDialogOpen(true)}
            onUnblockSelect={() => void handleUnblock()}
          />
        )}
      </header>
      {connectionStatus !== "connected" && <ChatConnectionBanner key={connectionStatus} status={connectionStatus} />}
      {onBlockUser && (
        <BlockUserDialog
          open={isBlockDialogOpen}
          onOpenChange={setIsBlockDialogOpen}
          contactName={conversation.contact.fullName}
          onConfirm={onBlockUser}
        />
      )}
      {unblockError && (
        <div role="alert" className="mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-center">
          <p className="text-sm text-red-800">No se pudo desbloquear. Intenta de nuevo.</p>
        </div>
      )}
      <div ref={containerRef} data-testid="messages-container" onScroll={handleScroll}
        className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-surface-soft p-4 md:p-6">
        {isMessagesError && !showInitialLoading && (
          <ChatErrorState
            message={messages.length === 0 ? "No pudimos cargar los mensajes de esta conversación." : "No pudimos actualizar el historial. Tus mensajes siguen visibles."}
            onRetry={isLoadingOlderError ? () => {
              loadingOlderRef.current = false;
              anchorRef.current = null;
              void loadOlderMessages();
            } : onRetryMessages}
          />
        )}
        {isLoadingMoreMessages && (
          <div role="status" data-testid="loading-older-messages" className="flex justify-center py-3">
            <span className="text-xs text-text-secondary">Cargando mensajes anteriores...</span>
          </div>
        )}
        {hasMoreMessages && !isLoadingMoreMessages && !isMessagesError && (
          <div className="flex justify-center py-2">
            <Button variant="ghost" type="button" onClick={() => void loadOlderMessages()}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-medium text-ink hover:bg-surface-soft">
              Cargar mensajes anteriores
            </Button>
          </div>
        )}
        {!hasMoreMessages && messages.length > 0 && !showInitialLoading && (
          <div data-testid="start-of-conversation" className="flex justify-center py-2">
            <span className="text-xs text-text-secondary">Inicio de la conversación</span>
          </div>
        )}
        {showInitialLoading ? (
          <div role="status" data-testid="initial-messages-loading" className="flex h-full items-center justify-center">
            <span className="text-sm text-text-secondary">Cargando conversación...</span>
          </div>
        ) : messages.length === 0 && !isMessagesError ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center text-text-secondary">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-surface text-ink">
              <MessageCircle className="size-6" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium">Sala de chat con {conversation.contact.fullName}</p>
            <p className="mt-1 text-xs">Aún no hay mensajes. Envía el primero para comenzar la conversación.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => {
              const isOwn = message.senderId === currentUserId;
              const showDateSeparator = shouldShowDateSeparator(messages, index, hasMoreMessages);
              return (
                <div key={message.id} data-message-id={message.id}>
                  <MessageItem
                    message={message}
                    isOwn={isOwn}
                    showDateSeparator={showDateSeparator}
                    onDownloadAttachment={handleDownloadAttachment}
                  />
                </div>
              );
            })}
          </div>
        )}
        <div data-testid="messages-scroll-anchor" />
      </div>
      {isBlockedByMe ? (
        <BlockedConversationNotice
          contactName={conversation.contact.fullName}
          isUnblocking={isUnblocking}
          onUnblock={() => void handleUnblock()}
        />
      ) : (
        <>
          {sendError && (
            <div role="alert" className="m-4 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-center">
              <p className="text-sm text-destructive">No se pudo enviar el mensaje. Conservamos tu texto; vuelve a pulsar Enviar para reintentar.</p>
            </div>
          )}
          {blockedSendError && (
            <div role="alert" data-testid="blocked-send-error" className="m-4 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-center">
              <p className="text-sm text-destructive">No es posible enviar mensajes en esta conversación</p>
            </div>
          )}
          <MessageInputBar
            value={inputText}
            onChange={setInputText}
            onSend={() => void handleSend()}
            onKeyDown={handleInputKeyDown}
            isSending={isSending || isSubmitting}
            isUploading={isUploading}
            sendDisabled={connectionStatus !== "connected"}
            attachment={selectedAttachment}
            onAttachmentChange={setSelectedAttachment}
            disabled={showInitialLoading || (isMessagesError && messages.length === 0)}
          />
        </>
      )}
      <ContactProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        contact={conversation.contact}
      />
    </div>
  );
}
