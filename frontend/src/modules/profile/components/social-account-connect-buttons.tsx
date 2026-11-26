"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FeedbackMessage } from "./feedback-message";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import {
  PORTFOLIO_ACCOUNT_MESSAGES,
  PORTFOLIO_PROVIDER_LABELS,
  PORTFOLIO_PROVIDERS,
} from "../constants/portfolio-accounts.constants";
import {
  useDisconnectPortfolioAccount,
  usePortfolioAccounts,
  useStartPortfolioOAuth,
} from "../hooks/use-portfolio-accounts";
import type { Feedback } from "../types/feedback.types";
import type { PortfolioAccountStatusResponse } from "../types/portfolio-account-status-response.types";
import type { PortfolioProviderName } from "../types/portfolio-provider-name.types";
import type { SocialAccountConnectButtonsProps } from "../types/social-account-connect-buttons-props.types";

function getProviderAccount(
  accounts: PortfolioAccountStatusResponse[] = [],
  provider: PortfolioProviderName,
): PortfolioAccountStatusResponse {
  const found = accounts.find((account) => account?.provider === provider);
  return (
    found ?? {
      provider,
      connected: false,
      username: null,
      profileUrl: null,
    }
  );
}

export function SocialAccountConnectButtons({ className }: SocialAccountConnectButtonsProps) {
  const { accounts = [] } = usePortfolioAccounts();
  const startOAuth = useStartPortfolioOAuth();
  const disconnectAccount = useDisconnectPortfolioAccount();
  const searchParams = useSearchParams();

  const [pendingProvider, setPendingProvider] = useState<PortfolioProviderName | null>(null);
  const [providerToDisconnect, setProviderToDisconnect] = useState<PortfolioProviderName | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const processedErrorRef = useRef<boolean>(false);

  useEffect(() => {
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted) setPendingProvider(null);
    };
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, []);

  useEffect(() => {
    const rawSearchParams =
      searchParams ??
      (typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null);
    if (!rawSearchParams) {
      return;
    }

    const provider = rawSearchParams.has("github_connection") ? "github" : rawSearchParams.has("gitlab_connection") ? "gitlab" : null;
    const result = provider ? rawSearchParams.get(`${provider}_connection`) : null;
    if (provider && result && !processedErrorRef.current) {
      processedErrorRef.current = true;
      const url = new URL(window.location.href);
      url.searchParams.delete(`${provider}_connection`);
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      setFeedback({
        type: result === "success" ? "success" : "error",
        message: result === "success" ? PORTFOLIO_ACCOUNT_MESSAGES.connectSuccess(PORTFOLIO_PROVIDER_LABELS[provider]) : result === "cancelled" ? PORTFOLIO_ACCOUNT_MESSAGES.userCancelled : result === "conflict" ? PORTFOLIO_ACCOUNT_MESSAGES.conflictError : PORTFOLIO_ACCOUNT_MESSAGES.genericError,
      });
    }
  }, [searchParams]);

  const handleConnect = (provider: PortfolioProviderName) => {
    setFeedback(null);
    setPendingProvider(provider);
    startOAuth.mutate(
      { provider },
      {
        onError: () => {
          setPendingProvider(null);
          setFeedback({
            type: "error",
            message: PORTFOLIO_ACCOUNT_MESSAGES.genericError,
          });
        },
      },
    );
  };

  const handleConfirmDisconnect = () => {
    if (!providerToDisconnect) {
      return;
    }
    const provider = providerToDisconnect;
    const providerLabel = PORTFOLIO_PROVIDER_LABELS[provider];

    disconnectAccount.mutate(provider, {
      onSuccess: () => {
        setProviderToDisconnect(null);
        setFeedback({
          type: "success",
          message: PORTFOLIO_ACCOUNT_MESSAGES.disconnectSuccess(providerLabel),
        });
      },
      onError: () => {
        setProviderToDisconnect(null);
        setFeedback({
          type: "error",
          message: PORTFOLIO_ACCOUNT_MESSAGES.disconnectError,
        });
      },
    });
  };

  return (
    <div role="group" aria-label={PORTFOLIO_ACCOUNT_MESSAGES.sectionTitle} className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
        {PORTFOLIO_PROVIDERS.map((provider) => {
          const account = getProviderAccount(accounts, provider);
          const isPending = pendingProvider === provider;
          const isConnected = account.connected;
          const providerLabel = provider === "github" ? "GitHub" : "GitLab";

          if (isConnected) {
            const username = (account.username ?? "").trim();
            const profileUrl = (account.profileUrl ?? "").trim();

            return (
              <div
                key={provider}
                className="col-span-1 flex min-h-11 min-w-0 flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface-soft px-3 py-2 sm:col-span-2"
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Image src={`/icons/${provider}.svg`} alt="" width={24} height={24} className="size-6 shrink-0" aria-hidden="true" />
                  <span className="text-sm font-medium text-ink">{providerLabel}</span>
                  <Badge
                    variant="outline"
                    className="gap-1 border-border bg-interaction text-xs font-medium text-app-header"
                  >
                    <Check className="size-4" aria-hidden="true" />
                    <span>{PORTFOLIO_ACCOUNT_MESSAGES.connected}</span>
                  </Badge>
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  {username ? (
                    profileUrl ? (
                      <a
                        href={profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-text-secondary hover:text-ink hover:underline"
                        title={`Ver perfil de ${username}`}
                      >
                        <span className="break-all">@{username}</span>
                        <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                      </a>
                    ) : (
                      <span className="text-xs break-all text-text-secondary">@{username}</span>
                    )
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-text-secondary hover:text-ink"
                    disabled={isPending || disconnectAccount.isPending}
                    onClick={() => handleConnect(provider)}
                    aria-label={`Reconectar cuenta de ${providerLabel}`}
                  >
                    {PORTFOLIO_ACCOUNT_MESSAGES.reconnect}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 border-border-strong px-2 text-xs text-ink hover:bg-surface-soft"
                    disabled={isPending || disconnectAccount.isPending}
                    onClick={() => {
                      setFeedback(null);
                      setProviderToDisconnect(provider);
                    }}
                    aria-label={`Desconectar cuenta de ${providerLabel}`}
                  >
                    {PORTFOLIO_ACCOUNT_MESSAGES.disconnect}
                  </Button>
                </div>
              </div>
            );
          }

          return (
            <Button
              key={provider}
              type="button"
              variant="outline"
              className="h-auto min-h-11 w-full min-w-0 justify-center gap-1.5 border-border-strong px-2 py-1 text-xs whitespace-normal text-ink hover:bg-surface-soft"
              disabled={isPending}
              onClick={() => handleConnect(provider)}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin text-text-secondary" aria-hidden="true" />
                  <span>{PORTFOLIO_ACCOUNT_MESSAGES.connecting}</span>
                </>
              ) : (
                <>
                  <Image src={`/icons/${provider}.svg`} alt="" width={20} height={20} className="size-5 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 text-left leading-tight break-words">{PORTFOLIO_ACCOUNT_MESSAGES.connectWith(providerLabel)}</span>
                </>
              )}
            </Button>
          );
        })}
      </div>
      <FeedbackMessage feedback={feedback} />
      <ConfirmDeleteDialog
        isOpen={providerToDisconnect !== null}
        title={
          providerToDisconnect
            ? PORTFOLIO_ACCOUNT_MESSAGES.disconnectTitle(
                PORTFOLIO_PROVIDER_LABELS[providerToDisconnect],
              )
            : ""
        }
        message={
          providerToDisconnect
            ? PORTFOLIO_ACCOUNT_MESSAGES.disconnectDescription(
                PORTFOLIO_PROVIDER_LABELS[providerToDisconnect],
              )
            : ""
        }
        confirmLabel={PORTFOLIO_ACCOUNT_MESSAGES.confirmDisconnect}
        isDeleting={disconnectAccount.isPending}
        onCancel={() => setProviderToDisconnect(null)}
        onConfirm={handleConfirmDisconnect}
      />
    </div>
  );
}
