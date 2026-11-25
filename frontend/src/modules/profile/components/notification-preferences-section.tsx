"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import {
  useNotificationPreferences,
  type NotificationChannel,
} from "@/modules/notifications";
import { PushGuideDialog } from "@/shared/components/push/push-guide-dialog";
import { PushPermissionPromptDialog } from "@/shared/components/push/push-permission-prompt-dialog";
import { usePushNotifications } from "@/shared/hooks/use-push-notifications";
import type { ActivateResult } from "@/shared/types/activate-result.types";
import type { PushGuideKind } from "@/shared/types/push-guide-kind.types";

import { NOTIFICATION_CHANNEL_OPTIONS } from "../constants/notification-channel-options.constants";
import {
  NOTIFICATION_PREFERENCES_MESSAGES,
  NOTIFICATION_PUSH_MESSAGES,
} from "../constants/profile-feedback.constants";
import type { Feedback } from "../types/feedback.types";
import { FeedbackMessage } from "./feedback-message";
import { SectionCard } from "./section-card";

const PUSH_DESCRIPTION_BY_ENVIRONMENT = {
  supported: "Te pediremos permiso para activar las alertas.",
  desktop: "Disponible en tu celular.",
  "ios-old": "No disponible en tu versión de iOS.",
  "ios-not-installed": "Primero agrega UMSSY a tu pantalla.",
  unsupported: "Disponible en tu celular.",
} as const;

const DISABLED_PUSH_ENVIRONMENTS = new Set(["desktop", "unsupported"]);

type PromptMode = "select" | "device";

function currentPermission(): NotificationPermission | null {
  if (typeof window === "undefined" || !("Notification" in window)) return null;
  return Notification.permission;
}

function guideForReason(reason: ActivateResult["reason"]): PushGuideKind | null {
  if (reason === "permission-blocked") return "blocked";
  if (reason === "ios-old" || reason === "ios-not-installed") return reason;
  return null;
}

function errorMessageForReason(reason: ActivateResult["reason"]): string {
  if (reason === "permission-dismissed") return NOTIFICATION_PUSH_MESSAGES.permissionDismissed;
  if (reason === "service-worker-unavailable") {
    return NOTIFICATION_PUSH_MESSAGES.serviceWorkerUnavailable;
  }
  if (reason === "unsupported" || reason === "desktop") return NOTIFICATION_PUSH_MESSAGES.unsupported;
  return NOTIFICATION_PUSH_MESSAGES.subscriptionError;
}

export function NotificationPreferencesSection() {
  const {
    environment,
    isSubscribed,
    isLoading: isPushLoading,
    activate,
  } = usePushNotifications();

  const { savedChannel, isLoading, loadError, isSaving, saveChannel } =
    useNotificationPreferences();

  const [pendingChannel, setPendingChannel] =
    useState<NotificationChannel | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [promptMode, setPromptMode] = useState<PromptMode | null>(null);
  const [guideKind, setGuideKind] = useState<PushGuideKind | null>(null);
  const [isDeviceRegistered, setIsDeviceRegistered] = useState(false);

  const isPushDisabled = DISABLED_PUSH_ENVIRONMENTS.has(environment);
  const isBusy = isSaving || isPushLoading;

  const selectedChannel = pendingChannel ?? savedChannel;
  const hasChanges = pendingChannel !== null && pendingChannel !== savedChannel;
  const needsDeviceActivation =
    savedChannel === "push" &&
    !isSubscribed &&
    environment === "supported" &&
    !hasChanges;

  function startPushFlow(mode: PromptMode): boolean {
    if (environment === "ios-old" || environment === "ios-not-installed") {
      setGuideKind(environment);
      return false;
    }
    if (currentPermission() === "denied") {
      setGuideKind("blocked");
      return false;
    }
    setPromptMode(mode);
    return true;
  }

  function handleChange(value: string) {
    const channel = value as NotificationChannel;
    setFeedback(null);

    if (channel === "push" && savedChannel !== "push") {
      const deviceReady = isSubscribed && currentPermission() === "granted";
      if (deviceReady) {
        setPendingChannel("push");
        return;
      }
      if (startPushFlow("select")) setPendingChannel("push");
      return;
    }

    setPendingChannel(channel);
  }

  function handleCancel() {
    setFeedback(null);
    setPendingChannel(null);
    setPromptMode(null);
  }

  function handlePromptDismiss() {
    if (promptMode === "select") setPendingChannel(null);
    setPromptMode(null);
  }

  function showActivationFailure(reason: ActivateResult["reason"]) {
    const guide = guideForReason(reason);
    if (guide) {
      setGuideKind(guide);
      return;
    }
    setFeedback({ type: "error", message: errorMessageForReason(reason) });
  }

  async function handlePromptContinue() {
    const mode = promptMode;
    setPromptMode(null);
    setFeedback(null);

    const result = await activate();

    if (result.ok) {
      setIsDeviceRegistered(true);
      setFeedback({
        type: "success",
        message:
          mode === "device"
            ? NOTIFICATION_PUSH_MESSAGES.deviceActivated
            : NOTIFICATION_PUSH_MESSAGES.permissionGranted,
      });
      return;
    }

    if (mode === "select") setPendingChannel(null);
    showActivationFailure(result.reason);
  }

  async function savePreference(channel: NotificationChannel) {
    try {
      await saveChannel(channel);
      setFeedback({
        type: "success",
        message: NOTIFICATION_PREFERENCES_MESSAGES.saved[channel],
      });
      setPendingChannel(null);
    } catch {
      setFeedback({
        type: "error",
        message: NOTIFICATION_PREFERENCES_MESSAGES.saveError,
      });
    }
  }

  async function handleSave() {
    if (!pendingChannel) return;

    if (pendingChannel === "push" && !isDeviceRegistered) {
      if (currentPermission() !== "granted") {
        startPushFlow("select");
        return;
      }

      setFeedback(null);
      const result = await activate();
      if (!result.ok) {
        setPendingChannel(null);
        showActivationFailure(result.reason);
        return;
      }
      setIsDeviceRegistered(true);
    }

    await savePreference(pendingChannel);
  }

  return (
    <SectionCard
      title="Preferencias de notificaciones"
      description="Elige cómo quieres recibir tus notificaciones."
    >
      {isLoading ? (
        <p role="status" className="text-sm text-text-secondary">
          {NOTIFICATION_PREFERENCES_MESSAGES.loading}
        </p>
      ) : null}

      {!isLoading && loadError ? (
        <FeedbackMessage
          feedback={{
            type: "error",
            message: NOTIFICATION_PREFERENCES_MESSAGES.loadError,
          }}
        />
      ) : null}

      {!isLoading && !loadError ? (
        <>
          <FeedbackMessage feedback={feedback} />

          <RadioGroup
            value={selectedChannel ?? ""}
            onValueChange={handleChange}
            disabled={isBusy}
            aria-label="Canal de notificaciones"
            className="flex flex-col gap-3 md:flex-row"
          >
            {NOTIFICATION_CHANNEL_OPTIONS.map(({ value, label, icon: Icon }) => {
              const isDisabled = value === "push" && isPushDisabled;
              const description =
                value === "push"
                  ? PUSH_DESCRIPTION_BY_ENVIRONMENT[environment]
                  : null;

              return (
                <Label
                  key={value}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border-2 border-border bg-surface p-4 transition-colors md:flex-1",
                    "has-data-checked:border-primary has-data-checked:bg-interaction",
                    "has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                    isDisabled
                      ? "cursor-not-allowed bg-muted opacity-60"
                      : "cursor-pointer hover:bg-accent/5",
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-interaction text-accent">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink">{label}</span>
                    {description ? (
                      <span className="mt-0.5 block text-sm font-normal text-text-secondary">
                        {description}
                      </span>
                    ) : null}
                  </span>
                  <RadioGroupItem
                    value={value}
                    disabled={isDisabled}
                    aria-label={label}
                  />
                </Label>
              );
            })}
          </RadioGroup>

          {savedChannel === "push" && !isSubscribed ? (
            <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <p role="status" className="text-sm text-text-secondary">
                {NOTIFICATION_PUSH_MESSAGES.noDeviceSubscription}
              </p>
              {needsDeviceActivation ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full border-border-strong px-4 text-sm text-ink md:w-auto"
                  disabled={isBusy}
                  onClick={() => {
                    setFeedback(null);
                    startPushFlow("device");
                  }}
                >
                  {NOTIFICATION_PUSH_MESSAGES.activateOnDevice}
                </Button>
              ) : null}
            </div>
          ) : null}

          {savedChannel === "push" && isSubscribed ? (
            <p role="status" className="mt-3 text-sm text-text-secondary">
              {NOTIFICATION_PUSH_MESSAGES.deviceSubscriptionActive}
            </p>
          ) : null}

          <p className="mt-4 flex items-center gap-3 rounded-lg bg-interaction px-4 py-3 text-sm text-ink">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bell aria-hidden="true" className="size-4" />
            </span>
            La campana de la app sigue activa con cualquier opción.
          </p>

          <div className="mt-5 flex flex-col gap-3 md:flex-row md:justify-end">
            <Button
              type="button"
              variant="cancel"
              size="lg"
              className="h-10 w-full border-border-strong px-4 text-sm text-ink hover:bg-surface-soft md:w-auto"
              disabled={!hasChanges || isBusy}
              onClick={handleCancel}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="h-10 w-full bg-primary px-4 text-sm text-primary-foreground hover:bg-brand-hover md:w-auto md:min-w-40"
              disabled={!hasChanges || isBusy}
              onClick={() => void handleSave()}
            >
              {isBusy ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </>
      ) : null}

      <PushPermissionPromptDialog
        open={promptMode !== null}
        onDismiss={handlePromptDismiss}
        onContinue={() => void handlePromptContinue()}
      />
      <PushGuideDialog kind={guideKind} onClose={() => setGuideKind(null)} />
    </SectionCard>
  );
}
