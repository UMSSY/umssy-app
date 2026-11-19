export const PROFILE_FEEDBACK_MESSAGES = {
  loading: "Cargando tu perfil...",
  loadError:
    "No se pudo cargar tu perfil. Recarga la página para intentarlo de nuevo.",
  citiesLoadError:
    "No se pudieron cargar las ciudades. Recarga la página para intentarlo de nuevo.",
  personalInfoSaveSuccess:
    "Tus datos personales se guardaron correctamente.",
  presentationSaveSuccess:
    "Tu presentación se guardó correctamente.",
  saveError:
    "No se pudieron guardar tus datos. Inténtalo de nuevo.",
};

export const PROFILE_ERROR_MESSAGES_BY_STATUS: Record<number, string> = {
  400: "Revisa los datos ingresados e inténtalo de nuevo.",
  401: "Tu sesión no es válida. Inicia sesión nuevamente.",
  404: "No encontramos tu perfil o la ciudad elegida. Recarga la página.",
};

export const NOTIFICATION_PREFERENCES_MESSAGES = {
  loading: "Cargando tus preferencias de notificaciones...",
  loadError:
    "No se pudieron cargar tus preferencias de notificaciones. Recarga la página para intentarlo de nuevo.",
  saveError:
    "No se pudo guardar tu preferencia. Inténtalo de nuevo.",
  saved: {
    push: "Listo: recibirás tus notificaciones en el celular (Push).",
    email: "Listo: recibirás tus notificaciones solo por correo.",
    "in-app": "Listo: recibirás tus notificaciones solo dentro de la app.",
  },
} as const;

export const NOTIFICATION_PUSH_MESSAGES = {
  permissionGranted:
    "Permiso concedido. Pulsa «Guardar cambios» para recibir tus notificaciones en el celular.",
  permissionDismissed:
    "No diste el permiso para las notificaciones, así que se mantiene tu preferencia anterior. Puedes intentarlo de nuevo.",
  subscriptionError:
    "No se pudo activar Push en este dispositivo, así que se mantiene tu preferencia anterior. Revisa tu conexión e inténtalo de nuevo.",
  serviceWorkerUnavailable:
    "No se pudo preparar la app para recibir Push. Cierra y vuelve a abrir UMSSY desde la pantalla de inicio e inténtalo de nuevo.",
  unsupported:
    "Este dispositivo no admite notificaciones Push. Elige otra opción.",
  deviceActivated:
    "Listo: las notificaciones Push quedaron activas en este dispositivo.",
  noDeviceSubscription:
    "No hay una suscripción Push activa en este dispositivo.",
  deviceSubscriptionActive:
    "Las notificaciones Push están activas en este dispositivo.",
  activateOnDevice: "Activar en este dispositivo",
} as const;