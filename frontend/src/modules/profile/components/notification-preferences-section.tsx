"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { NotificationChannel } from "@/modules/notifications";
import { usePushNotifications } from "@/shared/hooks/use-push-notifications";
import { NOTIFICATION_CHANNEL_OPTIONS } from "../constants/notification-channel-options.constants";
import { useNotificationPreferences } from "../hooks/use-notification-preferences";
import { getNotificationChannel } from "../utils/get-notification-channel";
import { toNotificationPreferencePayload } from "../utils/to-notification-preference-payload";
import { SectionCard } from "./section-card";

const PUSH_DESCRIPTION_BY_ENVIRONMENT = {
  supported: "Te pediremos permiso para activar las alertas.",
  desktop: "Disponible en tu celular.",
  "ios-old": "Requiere iOS 16.4 o superior.",
  "ios-not-installed": "Instala UMSSY en tu pantalla de inicio.",
  unsupported: "Disponible en tu celular.",
} as const;

export function NotificationPreferencesSection() {
  const { environment, permission, isSubscribed, isLoading: isPushLoading, activate, deactivate } =
    usePushNotifications();
  const { preferences, isLoading: isPreferencesLoading, updatePreferences, isUpdating } =
    useNotificationPreferences();
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);

  const selectedChannel = getNotificationChannel(preferences);
  const isPushAvailable = environment === "supported";
  const isBusy = isPreferencesLoading || isUpdating || isPushLoading;

  const saveChannel = async (channel: NotificationChannel) => {
    try {
      if (channel !== "push" && isSubscribed) await deactivate();
      await updatePreferences(toNotificationPreferencePayload(channel));
      toast.success("Preferencia guardada");
    } catch {
      toast.error("No se pudo guardar la preferencia. Inténtalo de nuevo.");
    }
  };

  const handleChannelChange = (channel: NotificationChannel) => {
    if (channel === selectedChannel) return;

    if (channel !== "push") {
      void saveChannel(channel);
      return;
    }

    if (permission === "denied") {
      toast.error("Las notificaciones están bloqueadas. Habilítalas en tu navegador.", {
        id: "push-denied",
      });
      return;
    }

    setIsPermissionDialogOpen(true);
  };

  const confirmPushActivation = async () => {
    setIsPermissionDialogOpen(false);
    const result = await activate();

    if (result.ok) {
      await saveChannel("push");
      return;
    }

    toast.error(
      result.reason === "permission-denied"
        ? "Permiso denegado. Habilítalo en la configuración de tu navegador."
        : "No se pudieron activar las notificaciones. Inténtalo de nuevo.",
      { id: "push-activation" },
    );
  };

  return (
    <SectionCard
      title="Preferencias de notificaciones"
      description="Elige cómo quieres recibir tus notificaciones."
      icon={<Bell aria-hidden="true" className="size-5" />}
    >
      <RadioGroup
        value={selectedChannel}
        onValueChange={(value) => handleChannelChange(value as NotificationChannel)}
        aria-label="Canal de notificaciones"
        aria-busy={isBusy}
        className="flex flex-col gap-3 md:flex-row"
      >
        {NOTIFICATION_CHANNEL_OPTIONS.map(({ value, label, icon: Icon }) => {
          const isDisabled = isBusy || (value === "push" && !isPushAvailable);
          const description = value === "push" ? PUSH_DESCRIPTION_BY_ENVIRONMENT[environment] : null;

          return (
            <Label
              key={value}
              className={cn(
                "flex items-center gap-3 rounded-lg border-2 border-border bg-surface p-4 transition-colors md:flex-1",
                "has-data-checked:border-primary has-data-checked:bg-interaction",
                "has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                isDisabled ? "cursor-not-allowed bg-muted opacity-60" : "cursor-pointer hover:bg-accent/5",
              )}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-interaction text-accent">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">{label}</span>
                {description ? (
                  <span className="mt-0.5 block text-sm font-normal text-text-secondary">{description}</span>
                ) : null}
              </span>
              <RadioGroupItem value={value} disabled={isDisabled} aria-label={label} />
            </Label>
          );
        })}
      </RadioGroup>

      <p className="mt-4 flex items-center gap-3 rounded-lg bg-interaction px-4 py-3 text-sm text-ink">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Bell aria-hidden="true" className="size-4" />
        </span>
        La campana de la app sigue activa con cualquier opción.
      </p>

      <AlertDialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activar notificaciones en el celular</AlertDialogTitle>
            <AlertDialogDescription>
              UMSSY te enviará alertas importantes incluso cuando la app esté cerrada. A continuación, tu
              navegador te pedirá permiso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmPushActivation()}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  );
}