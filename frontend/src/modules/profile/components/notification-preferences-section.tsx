"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { NotificationChannel } from "@/modules/notifications";
import { usePushNotifications } from "@/shared/hooks/use-push-notifications";
import { NOTIFICATION_CHANNEL_OPTIONS } from "../constants/notification-channel-options.constants";
import { SectionCard } from "./section-card";

const PUSH_DESCRIPTION_BY_ENVIRONMENT = {
  supported: "Te pediremos permiso para activar las alertas.",
  desktop: "Disponible en tu celular.",
  "ios-old": "Requiere iOS 16.4 o superior.",
  "ios-not-installed": "Instala UMSSY en tu pantalla de inicio.",
  unsupported: "Disponible en tu celular.",
} as const;

export function NotificationPreferencesSection() {
  const { environment } = usePushNotifications();
  const [selectedChannel, setSelectedChannel] = useState<NotificationChannel>("email");

  const isPushAvailable = environment === "supported";

  return (
    <SectionCard
      title="Preferencias de notificaciones"
      description="Elige cómo quieres recibir tus notificaciones."
      icon={<Bell aria-hidden="true" className="size-5" />}
    >
      <RadioGroup
        value={selectedChannel}
        onValueChange={(value) => setSelectedChannel(value as NotificationChannel)}
        aria-label="Canal de notificaciones"
        className="flex flex-col gap-3 md:flex-row"
      >
        {NOTIFICATION_CHANNEL_OPTIONS.map(({ value, label, icon: Icon }) => {
          const isDisabled = value === "push" && !isPushAvailable;
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
    </SectionCard>
  );
}