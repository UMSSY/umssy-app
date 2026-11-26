export const CHAT_MESSAGE_TOAST_TYPES: ReadonlySet<string> = new Set([
  "CHAT_MESSAGE",
  "CHAT_GROUP_MESSAGE",
]);

export const CHAT_MESSAGE_TOAST_DURATION_MS = 7000;

export const CHAT_MESSAGE_TOAST_TEXT = {
  brand: "UMSSY",
  time: "Ahora",
  subtitle: "Nuevo mensaje de chat",
  close: "Cerrar notificación",
} as const;

export const CHAT_MESSAGE_TOAST_LOGO_SRC = "/icons/umssy-simbolo-web.svg";

export const CHAT_MESSAGE_TITLE_PREFIXES: readonly string[] = [
  "Mensaje nuevo de: ",
  "Mensaje nuevo en: ",
];