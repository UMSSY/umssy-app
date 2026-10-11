'use client';

import { formatFileSize } from '@/modules/access-request/utils/format-file-size';
import { MessageAttachment } from '../types/conversation.types';

interface MessageAttachmentCardProps {
  messageId: string;
  attachment: MessageAttachment;
  isOwn: boolean;
}

export function MessageAttachmentCard({ messageId, attachment, isOwn }: MessageAttachmentCardProps) {
  const extension = attachment.name.split('.').pop() ?? '';

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      data-testid={`message-attachment-${messageId}`}
      aria-label={`Abrir archivo ${attachment.name}`}
      className={`mb-1.5 flex w-full min-w-0 items-center gap-2.5 rounded-xl border px-3 py-2 transition-colors ${
        isOwn
          ? 'border-white/20 bg-white/10 hover:bg-white/20'
          : 'border-[#E3E7EC] bg-[#F6F7F9] hover:bg-slate-100'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold uppercase ${
          isOwn ? 'bg-white/20 text-white' : 'bg-[#E30613]/10 text-[#E30613]'
        }`}
      >
        {extension}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold">{attachment.name}</span>
        <span className={`block text-[11px] ${isOwn ? 'text-slate-300' : 'text-[#5B6470]'}`}>
          {formatFileSize(attachment.size)}
        </span>
      </span>
    </a>
  );
}