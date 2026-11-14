"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, ExternalLink, FolderGit2, GitBranch, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { isApiError } from "@/shared/services/api-client";
import { FeedbackMessage } from "./feedback-message";
import {
  PORTFOLIO_ACCOUNT_MESSAGES,
  PORTFOLIO_PROVIDERS,
} from "../constants/portfolio-accounts.constants";
import {
  useCompletePortfolioOAuth,
  usePortfolioAccounts,
  useStartPortfolioOAuth,
} from "../hooks/use-portfolio-accounts";
import type { Feedback } from "../types/feedback.types";
import type {
  PortfolioAccountStatusResponse,
  PortfolioProviderName,
  SocialAccountConnectButtonsProps,
} from "../types/portfolio-account.types";

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
  const searchParams = useSearchParams();

  const [pendingProvider, setPendingProvider] = useState<PortfolioProviderName | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const processedCodeRef = useRef<string | null>(null);
  const processedErrorRef = useRef<boolean>(false);

  useEffect(() => {
    const rawSearchParams =
      searchParams ??
      (typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null);
    if (!rawSearchParams) {
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

    if (code && provider && processedCodeRef.current !== code) {
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
                provider === "github" ? "GitHub" : "GitLab",
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
      { provider, state: provider },
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

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label className="text-[12.5px] font-semibold text-ink">
        {PORTFOLIO_ACCOUNT_MESSAGES.sectionTitle}
      </Label>
      <FeedbackMessage feedback={feedback} />
      <div className="flex flex-col gap-2.5">
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
                className="flex h-11 w-full items-center justify-between rounded-md border border-border bg-surface-soft px-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  {provider === "github" ? (
                    <FolderGit2 className="size-4 shrink-0 text-ink-soft" aria-hidden="true" />
                  ) : (
                    <GitBranch className="size-4 shrink-0 text-ink-soft" aria-hidden="true" />
                  )}
                  <span className="text-sm font-medium text-ink">{providerLabel}</span>
                  <Badge
                    variant="outline"
                    className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                  >
                    <Check className="size-4" aria-hidden="true" />
                    <span>{PORTFOLIO_ACCOUNT_MESSAGES.connected}</span>
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {username ? (
                    profileUrl ? (
                      <a
                        href={profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-text-secondary hover:text-ink hover:underline"
                        title={`Ver perfil de ${username}`}
                      >
                        <span>@{username}</span>
                        <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                      </a>
                    ) : (
                      <span className="text-xs text-text-secondary">@{username}</span>
                    )
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-text-secondary hover:text-ink"
                    disabled={isPending}
                    onClick={() => handleConnect(provider)}
                    aria-label={`Reconectar cuenta de ${providerLabel}`}
                  >
                    {PORTFOLIO_ACCOUNT_MESSAGES.reconnect}
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
              className="h-11 w-full justify-center gap-2 border-border-strong text-ink hover:bg-surface-soft"
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
                  {provider === "github" ? (
                    <FolderGit2 className="size-4" aria-hidden="true" />
                  ) : (
                    <GitBranch className="size-4" aria-hidden="true" />
                  )}
                  <span>{PORTFOLIO_ACCOUNT_MESSAGES.connectWith(providerLabel)}</span>
                </>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
