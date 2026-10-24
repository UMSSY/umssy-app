/* eslint-disable @next/next/no-img-element */
'use client';

import { Button } from "@/components/ui/button";
import { Conversation } from '../types/conversation.types';
import { formatConversationDate, getInitials } from '../utils/date-formatter';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: (conversation: Conversation) => void;
}

export function ConversationItem({
  conversation,
  isSelected,
  onSelect,
}: ConversationItemProps) {
  const { contact, lastMessage, unreadCount } = conversation;
  const hasUnread = unreadCount > 0;

  const renderMessagePreview = () => {
    if (!lastMessage) {
      return <span className="text-text-secondary italic">Conversación iniciada</span>;
    }

    if (lastMessage.isAttachment) {
      const label =
        lastMessage.attachmentType === 'image'
          ? 'Foto'
          : lastMessage.attachmentType === 'audio'
          ? 'Audio'
          : 'Archivo';
      return (
        <span className="font-medium text-ink-soft">
          [{label}] {lastMessage.content}
        </span>
      );
    }

    return <span>{lastMessage.content}</span>;
  };

  return (
    <Button variant="ghost"
      type="button"
      onClick={() => onSelect(conversation)}
      aria-pressed={isSelected}
      className={`flex h-auto w-full items-center justify-start gap-3 rounded-none border-0 border-b border-border p-3.5 text-left transition-all hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent ${
        isSelected
          ? 'bg-interaction ring-1 ring-border-strong ring-inset'
          : 'bg-surface'
      }`}
    >
      <div className="relative shrink-0">
        {contact.avatarUrl ? (
          <img
            src={contact.avatarUrl}
            alt={contact.fullName}
            className="size-12 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-full border border-border-strong bg-border text-sm font-bold text-ink-soft">
            {getInitials(contact.fullName)}
          </div>
        )}

        {contact.isOnline && (
          <span
            className="absolute right-0 bottom-0 size-3.5 rounded-full border-2 border-surface bg-ink-soft shadow-xs"
            title="En línea"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between gap-1">
          <h4
            className={`truncate text-sm ${
              hasUnread ? 'font-bold text-ink' : 'font-semibold text-ink'
            }`}
          >
            {contact.fullName}
          </h4>
          <span
            className={`shrink-0 text-xs whitespace-nowrap ${
              hasUnread ? 'font-semibold text-accent' : 'text-text-secondary'
            }`}
          >
            {formatConversationDate(lastMessage?.createdAt || conversation.updatedAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p
            className={`flex-1 truncate text-xs ${
              hasUnread ? 'font-medium text-ink' : 'text-text-secondary'
            }`}
          >
            {renderMessagePreview()}
          </p>

              {hasUnread && (
            <span className="min-w-4 shrink-0 rounded-full bg-accent px-1.5 py-0.5 text-center text-[10px] font-bold text-surface shadow-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </Button>
  );
}