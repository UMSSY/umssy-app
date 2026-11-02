import { formatEventLocation } from '../utils/format-event-location';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Check, MessageCircle } from 'lucide-react';

import type { PassCardProps } from '../types/pass-card-props.types';

export function PassCard({
  title,
  date,
  status,
  location,
  registrationId,
  isSelected,
  onClick,
  onOpenChat,
}: PassCardProps) {
  return (
    <Card className="relative gap-0 border-0 bg-transparent p-0 shadow-none">
      <Button
        variant="ghost"
        type="button"
        aria-pressed={Boolean(isSelected)}
        onClick={onClick}
        className={cn("flex h-auto w-full min-w-0 flex-col items-stretch gap-4 rounded-lg p-5 pb-20 text-left whitespace-normal transition-all",
          isSelected
            ? 'border border-accent bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground'
            : 'border border-border bg-surface text-ink hover:border-border-strong'
        )}
      >
        <div
          className={cn("flex w-fit items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold",
            isSelected
              ? 'text-accent-foreground/85'
              : 'text-text-secondary'
          )}
        >
          <Check className="size-3" /> {status}
        </div>

        <div>
          <h3 className="mb-1 text-lg leading-tight font-bold [overflow-wrap:anywhere] break-words">
            {title}
          </h3>
          <div
            className={cn("flex items-center gap-2 text-sm",
              isSelected ? 'text-accent-foreground/85' : 'text-text-secondary'
            )}
          >
            <Calendar className="size-4 opacity-70" />
            <span className="min-w-0 break-words">{date}</span>
          </div>
          <p className="mt-2 text-sm [overflow-wrap:anywhere] break-words">
            {formatEventLocation(location)}
          </p>
        </div>
        <p className="min-w-0 text-xs">
          <span className="font-semibold">ID Inscripción: </span>
          <span className="break-all">{registrationId}</span>
        </p>
      </Button>
      <Button
        variant={isSelected ? "secondary" : "default"}
        size="default"
        type="button"
        className="absolute right-5 bottom-5"
        aria-label="Abrir chat del taller"
        title={onOpenChat ? 'Abrir chat del taller' : 'Chat del taller próximamente'}
        disabled={!onOpenChat}
        onClick={() => onOpenChat?.(registrationId)}
      >
        <MessageCircle className="size-5" aria-hidden="true" />
        <span>Chat</span>
      </Button>
    </Card>
  );
}
