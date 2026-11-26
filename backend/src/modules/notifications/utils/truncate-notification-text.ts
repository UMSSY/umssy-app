const NOTIFICATION_TEXT_MAX_LENGTH = 100;

export function truncateNotificationText(
  text: string,
  max: number = NOTIFICATION_TEXT_MAX_LENGTH,
): string {
  return text.length > max ? `${text.substring(0, max - 3)}...` : text;
}
