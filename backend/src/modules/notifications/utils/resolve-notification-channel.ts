export type NotificationChannel = 'push' | 'email' | 'in_app';

export type StoredChannelPreference = {
  pushEnabled: boolean;
  emailEnabled: boolean;
};

// Usuario sin registro (HU-16): pushEnabled = false, emailEnabled = true.
export const DEFAULT_NOTIFICATION_CHANNEL: NotificationChannel = 'email';

/**
 * Convierte la preferencia guardada en UN solo canal externo.
 *   push=true,  email=false -> 'push'   (En el celular)
 *   push=false, email=true  -> 'email'  (Solo por correo)
 *   push=false, email=false -> 'in_app' (Solo dentro de la app)
 * Si una fila antigua trae ambos en true, gana push para cumplir "únicamente por Push".
 * La campana in-app no depende de este resultado: siempre se crea.
 */
export function resolveNotificationChannel(
  preference: StoredChannelPreference | null | undefined,
): NotificationChannel {
  if (!preference) return DEFAULT_NOTIFICATION_CHANNEL;
  if (preference.pushEnabled) return 'push';
  if (preference.emailEnabled) return 'email';
  return 'in_app';
}