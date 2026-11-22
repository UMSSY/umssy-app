"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isApiError } from "@/shared/services/api-client";
import { FeedbackMessage } from "./feedback-message";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import {
  PORTFOLIO_ACCOUNT_MESSAGES,
  PORTFOLIO_PROVIDER_LABELS,
  PORTFOLIO_PROVIDERS,
} from "../constants/portfolio-accounts.constants";
import {
  useCompletePortfolioOAuth,
  useDisconnectPortfolioAccount,
  usePortfolioAccounts,
  useStartPortfolioOAuth,
} from "../hooks/use-portfolio-accounts";
import type { Feedback } from "../types/feedback.types";
import type { PortfolioAccountStatusResponse } from "../types/portfolio-account-status-response.types";
import type { PortfolioProviderName } from "../types/portfolio-provider-name.types";
import type { SocialAccountConnectButtonsProps } from "../types/social-account-connect-buttons-props.types";

function cleanUrlParams(): void {
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    url.searchParams.delete("code");
    url.searchParams.delete("provider");
    url.searchParams.delete("error");
    url.searchParams.delete("error_description");
    url.searchParams.delete("state");
    window.history.replaceState({}, "", `${url.pathname}${url.search ? url.search : ""}`);
  }
}

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
  const completeOAuth = useCompletePortfolioOAuth();
  const disconnectAccount = useDisconnectPortfolioAccount();
  const searchParams = useSearchParams();

  const [pendingProvider, setPendingProvider] = useState<PortfolioProviderName | null>(null);
  const [providerToDisconnect, setProviderToDisconnect] = useState<PortfolioProviderName | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const processedCodeRef = useRef<string | null>(null);
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

    const githubResult = rawSearchParams.get("github_connection");
    if (githubResult && !processedErrorRef.current) {
      processedErrorRef.current = true;
      const url = new URL(window.location.href);
      url.searchParams.delete("github_connection");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      setFeedback({
        type: githubResult === "success" ? "success" : "error",
        message: githubResult === "success" ? PORTFOLIO_ACCOUNT_MESSAGES.connectSuccess("GitHub") : githubResult === "cancelled" ? PORTFOLIO_ACCOUNT_MESSAGES.userCancelled : githubResult === "conflict" ? PORTFOLIO_ACCOUNT_MESSAGES.conflictError : PORTFOLIO_ACCOUNT_MESSAGES.genericError,
      });
      return;
    }

    const code = rawSearchParams.get("code");
    const error = rawSearchParams.get("error");
    const rawProvider = rawSearchParams.get("provider") ?? rawSearchParams.get("state");
    const provider =
      rawProvider === "gitlab" || rawProvider === "github"
        ? (rawProvider as PortfolioProviderName)
        : null;

    if (error && !processedErrorRef.current) {
      processedErrorRef.current = true;
      cleanUrlParams();
      setFeedback({
        type: "error",
        message:
          error === "access_denied"
            ? PORTFOLIO_ACCOUNT_MESSAGES.userCancelled
            : PORTFOLIO_ACCOUNT_MESSAGES.genericError,
      });
      return;
    }

    if (code && provider === "gitlab" && processedCodeRef.current !== code) {
      processedCodeRef.current = code;
      cleanUrlParams();
      setPendingProvider(provider);
      completeOAuth.mutate(
        { provider, payload: { code } },
        {
          onSuccess: () => {
            setPendingProvider(null);
            setFeedback({
              type: "success",
              message: PORTFOLIO_ACCOUNT_MESSAGES.connectSuccess(
                "GitLab",
              ),
            });
          },
          onError: (err) => {
            setPendingProvider(null);
            const isConflict = isApiError(err) && err.response?.status === 409;
            setFeedback({
              type: "error",
              message: isConflict
                ? PORTFOLIO_ACCOUNT_MESSAGES.conflictError
                : PORTFOLIO_ACCOUNT_MESSAGES.genericError,
            });
          },
        },
      );
    }
  }, [searchParams, completeOAuth]);

  const handleConnect = (provider: PortfolioProviderName) => {
    setFeedback(null);
    setPendingProvider(provider);
    startOAuth.mutate(
      { provider, ...(provider === "gitlab" ? { state: provider } : {}) },
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
      <div className="grid min-w-0 grid-cols-2 gap-2">
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
                className="col-span-2 flex min-h-11 min-w-0 flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface-soft px-3 py-2"
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
