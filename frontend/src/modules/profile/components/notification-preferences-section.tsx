"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type {
  NotificationChannel,
  NotificationPreferenceResponse,
} from "@/modules/notifications";
import { usePushNotifications } from "@/shared/hooks/use-push-notifications";

import { NOTIFICATION_CHANNEL_OPTIONS } from "../constants/notification-channel-options.constants";
import {
  NOTIFICATION_PREFERENCES_MESSAGES,
  NOTIFICATION_PUSH_MESSAGES,
} from "../constants/profile-feedback.constants";
import { useNotificationPreferences } from "../hooks/use-notification-preferences";
import type { Feedback } from "../types/feedback.types";
import { FeedbackMessage } from "./feedback-message";
import { SectionCard } from "./section-card";

const PUSH_DESCRIPTION_BY_ENVIRONMENT = {
  supported: "Te pediremos permiso para activar las alertas.",
  desktop: "Disponible en tu celular.",
  "ios-old": "Requiere iOS 16.4 o superior.",
  "ios-not-installed": "Instala UMSSY en tu pantalla de inicio.",
  unsupported: "Disponible en tu celular.",
} as const;

function preferencesToChannel(
  preferences: NotificationPreferenceResponse | undefined,
): NotificationChannel | null {
  if (!preferences) return null;
  if (preferences.pushEnabled) return "push";
  if (preferences.emailEnabled) return "email";
  return "in-app";
}

function channelToPreferences(channel: NotificationChannel) {
  return {
    pushEnabled: channel === "push",
    emailEnabled: channel === "email",
    inAppEnabled: channel === "in-app",
  };
}

export function NotificationPreferencesSection() {
  const {
    environment,
    permission,
    isSubscribed,
    isLoading: isPushLoading,
    activate,
  } = usePushNotifications();

  const { preferences, isLoading, isError, updatePreferences, isUpdating } =
    useNotificationPreferences();

  const [pendingChannel, setPendingChannel] =
    useState<NotificationChannel | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isPushDialogOpen, setIsPushDialogOpen] = useState(false);

  const savedChannel = preferencesToChannel(preferences);
  const isPushAvailable = environment === "supported";
  const isBusy = isUpdating || isPushLoading;

  const selectedChannel = pendingChannel ?? savedChannel;
  const hasChanges = pendingChannel !== null && pendingChannel !== savedChannel;

  function handleChange(value: string) {
    setFeedback(null);
    setPendingChannel(value as NotificationChannel);
  }

  function handleCancel() {
    setFeedback(null);
    setPendingChannel(null);
    setIsPushDialogOpen(false);
  }

  async function savePreference(channel: NotificationChannel) {
    try {
      await updatePreferences(channelToPreferences(channel));
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

    if (pendingChannel === "push") {
      if (!isPushAvailable) {
        setFeedback({
          type: "error",
          message: NOTIFICATION_PUSH_MESSAGES.unsupported,
        });
        return;
      }

      setIsPushDialogOpen(true);
      return;
    }

    await savePreference(pendingChannel);
  }

  async function handleConfirmPush() {
    if (pendingChannel !== "push") return;

    setIsPushDialogOpen(false);
    setFeedback(null);

    const result = await activate();

    if (!result.ok) {
      let message: string = NOTIFICATION_PUSH_MESSAGES.subscriptionError;

      if (result.reason === "permission-denied") {
        message =
          permission === "denied"
            ? NOTIFICATION_PUSH_MESSAGES.permissionBlocked
            : NOTIFICATION_PUSH_MESSAGES.permissionDismissed;
      } else if (result.reason === "unsupported") {
        message = NOTIFICATION_PUSH_MESSAGES.unsupported;
      }

      setFeedback({ type: "error", message });
      setPendingChannel(null);
      return;
    }

    await savePreference("push");
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

      {!isLoading && isError ? (
        <FeedbackMessage
          feedback={{
            type: "error",
            message: NOTIFICATION_PREFERENCES_MESSAGES.loadError,
          }}
        />
      ) : null}

      {!isLoading && !isError ? (
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
              const isDisabled = value === "push" && !isPushAvailable;
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
            <p role="status" className="mt-3 text-sm text-text-secondary">
              No hay una suscripción Push activa en este dispositivo.
            </p>
          ) : null}

          {savedChannel === "push" && isSubscribed ? (
            <p role="status" className="mt-3 text-sm text-text-secondary">
              Las notificaciones Push están activas en este dispositivo.
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
              variant="outline"
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

      <AlertDialog
        open={isPushDialogOpen}
        onOpenChange={(open) => {
          if (!open) setIsPushDialogOpen(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {NOTIFICATION_PUSH_MESSAGES.dialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {NOTIFICATION_PUSH_MESSAGES.dialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {NOTIFICATION_PUSH_MESSAGES.dialog.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              onClick={() => void handleConfirmPush()}
            >
              {NOTIFICATION_PUSH_MESSAGES.dialog.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  );
}