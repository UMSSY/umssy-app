
"use client";

import { ArrowLeft, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { ConnectionRequest } from "../types/connection-request.types";
import { getInitials } from "../utils/date-formatter";

interface ConnectionRequestDetailProps {
  request: ConnectionRequest;
  onBack: () => void;
}

export function ConnectionRequestDetail({
  request,
  onBack,
}: ConnectionRequestDetailProps) {
  const sender = request.sender;

  const fullName = sender
    ? `${sender.firstName} ${sender.lastName}`.trim()
    : "Usuario";

  return (
    <section className="flex h-full min-h-0 flex-col bg-surface">
      <header className="flex min-h-16 items-center gap-3 border-b border-border px-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="Volver a la lista de chats"
          className="md:hidden"
        >
          <ArrowLeft className="size-5" />
        </Button>

        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-border font-semibold text-ink">
          {getInitials(fullName)}
        </div>

        <div className="min-w-0">
          <h2 className="truncate font-semibold text-ink">
            {fullName}
          </h2>
          <p className="text-xs text-text-secondary">
            Solicitud de conexión
          </p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-5 py-10">
        <div className="flex size-24 items-center justify-center rounded-full border border-border-strong bg-border text-2xl font-bold text-ink">
          {getInitials(fullName)}
        </div>

        <h3 className="mt-4 text-xl font-bold text-ink">
          {fullName}
        </h3>

        {sender?.headline && (
          <p className="mt-2 max-w-md text-center text-sm text-text-secondary">
            {sender.headline}
          </p>
        )}

        <div className="mt-8 w-full max-w-md rounded-xl border border-border bg-surface p-6 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-interaction text-accent">
            <UserRound className="size-6" />
          </div>

          <h4 className="text-base font-bold text-ink">
            Te ha enviado una solicitud de conexión
          </h4>

          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            Si aceptas, podrán iniciar una conversación privada
            de chat uno a uno.
          </p>

          <p className="mt-5 text-xs text-text-secondary">
            Solicitud pendiente de respuesta
          </p>
        </div>
      </div>
    </section>
  );
}
