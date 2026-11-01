"use client";

/* eslint-disable @next/next/no-img-element */

import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { UserRoundPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { useContactSearch } from "../hooks/use-contact-search";
import { useSendConnectionRequest } from "../hooks/use-send-connection-request";
import {
  getSentConnectionRequests,
  getReceivedConnectionRequests,
  getAcceptedConnectionRequests,
} from "../services/connection-request-api";
import {
  getChatActionErrorMessage,
  getChatHttpStatus,
} from "../utils/chat-action-error";
import { getInitials } from "../utils/date-formatter";
import type { User } from "../types/user.types";
import type { ConnectionRequest } from "../types/connection-request.types";

interface ContactSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContact: (user: User) => void | Promise<void>;
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  const status = getChatHttpStatus(error);

  return status !== 401 && status !== 403 && failureCount < 2;
}

export function ContactSearchModal({
  isOpen,
  onClose,
  onSelectContact,
}: ContactSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [sendingUserId, setSendingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actionPendingRef = useRef(false);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const {
    results,
    isSearching,
    isError: isSearchError,
    error: searchError,
    refetch: retrySearch,
  } = useContactSearch(searchTerm, isOpen);

  const sendRequest = useSendConnectionRequest();

  const sentQuery = useQuery({
    queryKey: ["chat", "connection-requests", "sent"],
    queryFn: getSentConnectionRequests,
    enabled: isOpen,
    retry: shouldRetry,
  });

  const receivedQuery = useQuery({
    queryKey: ["chat", "connection-requests", "received"],
    queryFn: getReceivedConnectionRequests,
    enabled: isOpen,
    retry: shouldRetry,
  });

  const acceptedQuery = useQuery({
    queryKey: ["chat", "connection-requests", "accepted"],
    queryFn: getAcceptedConnectionRequests,
    enabled: isOpen,
    retry: shouldRetry,
  });

  const sentRequests = sentQuery.data ?? [];
  const receivedRequests = receivedQuery.data ?? [];
  const acceptedRequests = acceptedQuery.data ?? [];

  const isLoadingStatuses =
    sentQuery.isPending ||
    receivedQuery.isPending ||
    acceptedQuery.isPending;

  const hasStatusError =
    sentQuery.isError ||
    receivedQuery.isError ||
    acceptedQuery.isError;

  const statusErrors = [
    sentQuery.error,
    receivedQuery.error,
    acceptedQuery.error,
  ];

  const statusError =
    statusErrors.find((item) => getChatHttpStatus(item) === 401) ??
    statusErrors.find((item) => getChatHttpStatus(item) === 403) ??
    statusErrors.find((item) => item != null);

  useEffect(() => {
    if (selectedIndex >= 0) {
      optionRefs.current[selectedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  const handleClose = () => {
    if (actionPendingRef.current) return;

    setSearchTerm("");
    setSelectedIndex(-1);
    setError(null);
    onClose();
  };

  const getRequestStatus = (userId: string) => {
    const accepted = acceptedRequests.some(
      (request: ConnectionRequest) =>
        request.status?.title === "ACCEPTED" &&
        (request.senderId === userId || request.receiverId === userId),
    );

    if (accepted) return "ACCEPTED";

    const received = receivedRequests.some(
      (request: ConnectionRequest) =>
        request.senderId === userId &&
        request.status?.title === "PENDING",
    );

    if (received) return "RECEIVED";

    const sent = sentRequests.some(
      (request: ConnectionRequest) =>
        request.receiverId === userId &&
        request.status?.title === "PENDING",
    );

    if (sent) return "PENDING";

    const rejected = [...sentRequests, ...receivedRequests].some(
      (request: ConnectionRequest) =>
        (request.senderId === userId || request.receiverId === userId) &&
        request.status?.title === "REJECTED",
    );

    if (rejected) return "REJECTED";

    return "NONE";
  };

  const handleUserAction = async (user: User) => {
    if (
      actionPendingRef.current ||
      isSearching ||
      isSearchError ||
      hasStatusError ||
      isLoadingStatuses
    ) {
      return;
    }

    const status = getRequestStatus(user.id);

    if (status !== "ACCEPTED" && status !== "NONE") return;

    actionPendingRef.current = true;
    setSendingUserId(user.id);
    setError(null);

    try {
      if (status === "ACCEPTED") {
        await onSelectContact(user);

        actionPendingRef.current = false;
        handleClose();
      } else {
        await sendRequest.mutateAsync(user.id);
      }
    } catch (err) {
      setError(
        getChatActionErrorMessage(
          err,
          status === "ACCEPTED"
            ? "No se pudo abrir la conversación. Intenta nuevamente."
            : "No se pudo enviar la solicitud. Intenta nuevamente.",
        ),
      );
    } finally {
      actionPendingRef.current = false;
      setSendingUserId(null);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      handleClose();
      return;
    }

    if (
      results.length === 0 ||
      isSearching ||
      isSearchError ||
      actionPendingRef.current
    ) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((previous) =>
        previous < results.length - 1 ? previous + 1 : 0,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((previous) =>
        previous > 0 ? previous - 1 : results.length - 1,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();

      if (selectedIndex >= 0 && selectedIndex < results.length) {
        void handleUserAction(results[selectedIndex]);
      }
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-medium text-ink">
            Nueva conversación
          </DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <Input
            autoFocus
            disabled={Boolean(sendingUserId)}
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setSelectedIndex(-1);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            aria-label="Buscar contactos"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {hasStatusError && (
          <div role="alert" className="text-sm text-destructive">
            <p>
              {getChatActionErrorMessage(
                statusError,
                "No se pudieron consultar las solicitudes.",
              )}
            </p>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                void sentQuery.refetch();
                void receivedQuery.refetch();
                void acceptedQuery.refetch();
              }}
            >
              Reintentar
            </Button>
          </div>
        )}

        <div className="mt-2 flex max-h-[320px] flex-col overflow-y-auto">
          {isSearchError ? (
            <div role="alert" className="py-4 text-sm text-destructive">
              <p>
                {getChatActionErrorMessage(
                  searchError,
                  "No se pudo realizar la búsqueda. Intenta nuevamente.",
                )}
              </p>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => void retrySearch()}
              >
                Reintentar búsqueda
              </Button>
            </div>
          ) : isSearching ? (
            <div role="status" className="py-6 text-center text-sm">
              Buscando...
            </div>
          ) : results.length > 0 ? (
            results.map((user, index) => {
              const status = getRequestStatus(user.id);
              const isSendingThisUser = sendingUserId === user.id;
              const isSelected = selectedIndex === index;

              const isDisabled =
                isLoadingStatuses ||
                hasStatusError ||
                Boolean(sendingUserId) ||
                status === "PENDING" ||
                status === "RECEIVED" ||
                status === "REJECTED";

              const buttonText = isSendingThisUser
                ? status === "ACCEPTED"
                  ? "Abriendo..."
                  : "Enviando..."
                : isLoadingStatuses
                  ? "Consultando..."
                  : hasStatusError
                    ? "No disponible"
                    : status === "PENDING"
                      ? "Solicitud enviada"
                      : status === "RECEIVED"
                        ? "Solicitud recibida"
                        : status === "ACCEPTED"
                          ? "Abrir chat"
                          : status === "REJECTED"
                            ? "Solicitud rechazada"
                            : "Enviar Solicitud";

              return (
                <div
                  key={user.id}
                  className={`flex min-w-0 items-center gap-3 border-b border-border px-2 py-3 ${
                    isSelected ? "bg-surface-soft" : ""
                  }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="size-10 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="flex size-10 shrink-0 items-center justify-center rounded bg-border text-sm font-bold text-ink-soft">
                      {getInitials(user.fullName)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {user.fullName}
                    </p>

                    {user.headline && (
                      <p className="truncate text-xs text-text-secondary">
                        {user.headline}
                      </p>
                    )}
                  </div>

                  <Button
                    ref={(element) => {
                      optionRefs.current[index] = element;
                    }}
                    type="button"
                    size="sm"
                    variant={status === "NONE" ? "default" : "secondary"}
                    disabled={isDisabled}
                    onClick={() => void handleUserAction(user)}
                    className={`shrink-0 gap-2 text-xs ${
                      status === "PENDING" ? "bg-gray-400 text-white" : ""
                    }`}
                  >
                    <UserRoundPlus className="size-4" aria-hidden="true" />
                    {buttonText}
                  </Button>
                </div>
              );
            })
          ) : (
            searchTerm.trim().length >= 2 && (
              <div
                role="status"
                className="py-6 text-center text-sm text-text-secondary"
              >
                No hay contactos disponibles que coincidan con tu búsqueda.
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}