"use client";

import { Button } from "@/components/ui/button";
interface EmptyChatStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyChatState({
  description = 'Selecciona una conversacion existente en el panel izquierdo o inicia una nueva para comenzar a comunicarte.',
  actionLabel = 'Iniciar una nueva conversacion',
  onAction,
}: EmptyChatStateProps) {
  return (
    <div className="flex h-full min-h-[350px] flex-col items-center justify-center p-8 text-center">
      <p className="mb-5 max-w-sm text-xs leading-relaxed text-slate-400 md:text-sm">
        {description}
      </p>

      {onAction && (
        <Button
          unstyled
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center rounded-lg bg-[#0B2545] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#13294B] focus:outline-none active:scale-98 md:text-sm"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}