"use client";

import { Button } from "@/components/ui/button";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import type { KeyboardEvent } from 'react';
import Image from 'next/image';

import { Conversation, Message } from '../types/conversation.types';
import { MessageInputBar } from './message-input-bar';
import { ChatErrorState } from './chat-error-state';
import { getInitials } from '../utils/date-formatter';
import { isContentValidForSend } from '../utils/unicode-counter';

interface ChatRoomProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
  onBack: () => void;
  onSendMessage: (content: string) => void | Promise<void>;
  isLoadingMessages?: boolean;
  isSending?: boolean;
  hasMoreMessages?: boolean;
  onLoadMoreMessages?: () => void | Promise<unknown>;
  isLoadingMoreMessages?: boolean;
  isMessagesError?: boolean;
  isLoadingOlderError?: boolean;
  onRetryMessages?: () => void;
}

function getMessageDate(message: Message): string {
  return message.timestamp || message.createdAt || '';
}

function formatMessageTime(isoString?: string | null): string {
  if (!isoString) return '';

  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) return '';

  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const hour12 = String(hours % 12 || 12).padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';

  return `${hour12}:${minutes} ${period}`;
}

function formatMessageDate(isoString?: string | null): string {
  if (!isoString) return '';

  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('es-BO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(date)
    .toUpperCase();
}

function isSameDay(
  firstDate?: string | null,
  secondDate?: string | null,
): boolean {
  if (!firstDate || !secondDate) return false;

  const first = new Date(firstDate);
  const second = new Date(secondDate);

  if (
    Number.isNaN(first.getTime()) ||
    Number.isNaN(second.getTime())
  ) {
    return false;
  }

  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export function ChatRoom(props: ChatRoomProps) {
  return (
    <ChatRoomContent
      key={props.conversation.id}
      {...props}
    />
  );
}

function ChatRoomContent({
  conversation,
  messages,
  currentUserId,
  onBack,
  onSendMessage,
  isLoadingMessages = false,
  isSending = false,
  hasMoreMessages = false,
  onLoadMoreMessages,
  isLoadingMoreMessages = false,
  isMessagesError = false,
  isLoadingOlderError = false,
  onRetryMessages,
}: ChatRoomProps) {
  const [inputText, setInputText] = useState('');
  const [sendError, setSendError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sendPendingRef = useRef(false);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const previousScrollHeightRef = useRef(0);
  const previousScrollTopRef = useRef(0);
  const previousMessagesLengthRef = useRef(0);

  const isLoadingPreviousPageRef = useRef(false);

  const loadOlderMessages = useCallback(async () => {
    const container = messagesContainerRef.current;

    if (
      !container ||
      !onLoadMoreMessages ||
      !hasMoreMessages ||
      isLoadingMoreMessages ||
      isLoadingPreviousPageRef.current
    ) {
      return;
    }

    previousScrollHeightRef.current = container.scrollHeight;
    previousScrollTopRef.current = container.scrollTop;
    isLoadingPreviousPageRef.current = true;

    try {
      await onLoadMoreMessages();
    } catch {
      isLoadingPreviousPageRef.current = false;
    }
  }, [
    hasMoreMessages,
    isLoadingMoreMessages,
    onLoadMoreMessages,
  ]);

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;

    if (!container) return;

    if (container.scrollTop <= 80 && !isMessagesError) {
      void loadOlderMessages();
    }
  };

  useLayoutEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) return;

    const previousLength = previousMessagesLengthRef.current;
    const currentLength = messages.length;

    if (isLoadingPreviousPageRef.current) {
      if (currentLength > previousLength) {
        const heightDifference =
          container.scrollHeight -
          previousScrollHeightRef.current;

        container.scrollTop =
          previousScrollTopRef.current + heightDifference;

        isLoadingPreviousPageRef.current = false;
      } else if (!isLoadingMoreMessages) {
        isLoadingPreviousPageRef.current = false;
      }
    } else if (previousLength === 0 && currentLength > 0) {
      container.scrollTop = container.scrollHeight;
    } else if (currentLength > previousLength) {
      container.scrollTop = container.scrollHeight;
    }

    previousMessagesLengthRef.current = currentLength;
  }, [messages.length, isLoadingMoreMessages]);

  useEffect(() => {
    previousScrollHeightRef.current = 0;
    previousScrollTopRef.current = 0;
    previousMessagesLengthRef.current = 0;
    isLoadingPreviousPageRef.current = false;
  }, [conversation.id]);

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (
      !container ||
      messages.length === 0 ||
      isMessagesError ||
      !hasMoreMessages ||
      isLoadingMoreMessages ||
      isLoadingPreviousPageRef.current
    ) {
      return;
    }

    if (container.scrollHeight <= container.clientHeight) {
      void loadOlderMessages();
    }
  }, [
    messages.length,
    isMessagesError,
    hasMoreMessages,
    isLoadingMoreMessages,
    loadOlderMessages,
  ]);

  const handleSend = async () => {
    if (
      !isContentValidForSend(inputText) ||
      isSending ||
      sendPendingRef.current ||
      isLoadingMessages ||
      (isMessagesError && messages.length === 0)
    ) {
      return;
    }

    const content = inputText.trim();
    if (!content) return;

    sendPendingRef.current = true;
    setIsSubmitting(true);
    setSendError(false);

    try {
      await onSendMessage(content);
      setInputText('');
    } catch {
      setSendError(true);
    } finally {
      sendPendingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleInputKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <div
      data-testid="chat-room"
      className="flex size-full min-h-0 min-w-0 flex-col overflow-hidden bg-[#F6F7F9]"
    >
      <header
        data-testid="chat-room-header"
        className="z-10 flex w-full min-w-0 shrink-0 items-center justify-between border-b border-[#E3E7EC] bg-white p-3 md:p-4"
      >
        <div className="flex items-center gap-3">
          <Button
            unstyled
            type="button"
            data-testid="chat-back-button"
            onClick={onBack}
            className="-ml-1 rounded-lg p-1.5 text-[#5B6470] transition-colors hover:bg-slate-100 hover:text-[#0B1F2E] md:hidden"
            aria-label="Volver a la lista de chats"
          >
            <svg
              className="size-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Button>

          <div className="relative shrink-0">
            {conversation.contact.avatarUrl ? (
              <Image
                src={conversation.contact.avatarUrl}
                alt={conversation.contact.fullName}
                width={40}
                height={40}
                unoptimized
                className="size-10 rounded-full border border-[#E3E7EC] object-cover"
              />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full border border-[#E3E7EC] bg-slate-200 text-xs font-bold text-[#0B1F2E]">
                {getInitials(conversation.contact.fullName)}
              </div>
            )}

            {conversation.contact.isOnline && (
              <span
                data-testid="online-indicator"
                className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-white bg-emerald-500 shadow-xs"
                title="En linea"
              />
            )}
          </div>

          <div>
            <h3
              data-testid="chat-contact-name"
              className="text-sm leading-tight font-bold text-[#0B1F2E] md:text-base"
            >
              {conversation.contact.fullName}
            </h3>

            <span className="text-xs font-medium text-emerald-600">
              {conversation.contact.isOnline
                ? 'En linea'
                : 'Desconectado'}
            </span>
          </div>
        </div>
      </header>

      <div
        ref={messagesContainerRef}
        data-testid="messages-container"
        onScroll={handleMessagesScroll}
        className="min-h-0 min-w-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto bg-[#F6F7F9] p-4 md:p-6"
      >
        {isMessagesError && !isLoadingMessages && (
          <ChatErrorState
            message={
              messages.length === 0
                ? 'No pudimos cargar los mensajes de esta conversación.'
                : 'No pudimos actualizar el historial. Tus mensajes siguen visibles.'
            }
            onRetry={
              isLoadingOlderError
                ? () => {
                    void loadOlderMessages();
                  }
                : onRetryMessages
            }
          />
        )}

        {isLoadingMoreMessages && (
          <div
            data-testid="loading-older-messages"
            role="status"
            className="flex justify-center py-2"
          >
            <span className="text-xs text-[#5B6470]">
              Cargando mensajes anteriores...
            </span>
          </div>
        )}

        {hasMoreMessages && !isLoadingMoreMessages && !isMessagesError && (
          <div className="flex justify-center py-2">
            <Button
              unstyled
              type="button"
              onClick={() => void loadOlderMessages()}
              className="rounded-lg border border-[#E3E7EC] bg-white px-4 py-2 text-xs font-medium text-[#0B1F2E] hover:bg-slate-50"
            >
              Cargar mensajes anteriores
            </Button>
          </div>
        )}

        {!hasMoreMessages &&
          messages.length > 0 &&
          !isLoadingMessages &&
          !isLoadingMoreMessages && (
            <div
              data-testid="start-of-conversation"
              className="flex justify-center py-2"
            >
              <span className="text-xs text-slate-400">
                Inicio de la conversacion
              </span>
            </div>
          )}

        {isLoadingMessages ? (
          <div role="status" className="space-y-4 py-6">
            <p className="text-center text-sm text-[#5B6470]">
              Sala de chat con {conversation.contact.fullName}
            </p>
            <p className="text-center text-sm text-[#5B6470]">
              Cargando mensajes...
            </p>
            <div
              aria-hidden="true"
              className="space-y-4 motion-safe:animate-pulse"
            >
              <div className="h-12 w-2/3 rounded-2xl bg-slate-200" />
              <div className="ml-auto h-16 w-1/2 rounded-2xl bg-slate-200" />
              <div className="h-12 w-1/2 rounded-2xl bg-slate-200" />
            </div>
          </div>
        ) : messages.length === 0 && !isMessagesError ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center text-[#5B6470]">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-blue-50 text-[#0B1F2E]">
              <svg
                className="size-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>

            <p className="text-sm font-medium text-slate-600">
              Sala de chat con {conversation.contact.fullName}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Aún no hay mensajes. Envía el primero para comenzar la conversación.
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.senderId === currentUserId;

            const senderName = isOwn
              ? 'Tú'
              : conversation.contact.fullName;

            const messageDate = getMessageDate(message);

            const previousMessage =
              index > 0 ? messages[index - 1] : null;

            const showDateSeparator =
              !previousMessage ||
              !isSameDay(
                getMessageDate(previousMessage),
                messageDate,
              );

            return (
              <div key={message.id}>
                {showDateSeparator && (
                  <div
                    data-testid={`date-separator-${message.id}`}
                    className="my-5 flex items-center gap-3"
                  >
                    <div className="h-px flex-1 bg-[#E3E7EC]" />

                    <span className="text-center text-[11px] font-semibold whitespace-nowrap text-[#5B6470]">
                      {formatMessageDate(messageDate)}
                    </span>

                    <div className="h-px flex-1 bg-[#E3E7EC]" />
                  </div>
                )}

                <div
                  data-testid={`message-item-${message.id}`}
                  className={`flex w-full min-w-0 ${
                    isOwn ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] min-w-0 rounded-2xl px-4 py-2.5 text-sm [overflow-wrap:anywhere] break-words shadow-xs md:max-w-[70%] ${
                      isOwn
                        ? 'rounded-tr-xs bg-[#0B1F2E] text-white'
                        : 'rounded-tl-xs border border-[#E3E7EC] bg-white text-[#0B1F2E]'
                    }`}
                  >
                    <p
                      className={`mb-1 text-xs font-semibold ${
                        isOwn
                          ? 'text-slate-200'
                          : 'text-[#2563EB]'
                      }`}
                    >
                      {senderName}
                    </p>

                    <p className="leading-relaxed [overflow-wrap:anywhere] break-words whitespace-pre-wrap">
                      {message.content}
                    </p>

                    <div
                      className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${
                        isOwn
                          ? 'text-slate-300'
                          : 'text-[#5B6470]'
                      }`}
                    >
                      <span>{formatMessageTime(messageDate)}</span>

                      {isOwn && (
                        <span className="font-medium">
                          {message.status === 'sending'
                            ? 'Enviando...'
                            : message.status === 'error'
                              ? 'Error'
                              : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div data-testid="messages-scroll-anchor" />
      </div>

      {sendError && (
        <ChatErrorState message="No se pudo enviar el mensaje. Conservamos tu texto; vuelve a pulsar Enviar para reintentar." />
      )}

      <MessageInputBar
        value={inputText}
        onChange={setInputText}
        onSend={() => void handleSend()}
        onKeyDown={handleInputKeyDown}
        isSending={isSending || isSubmitting}
        disabled={isLoadingMessages || (isMessagesError && messages.length === 0)}
      />
    </div>
  );
}