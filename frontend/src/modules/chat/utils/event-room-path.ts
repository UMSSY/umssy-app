export function getEventRoomPath(registrationId: string): string {
  return `/chat/event/${encodeURIComponent(registrationId)}`;
}
