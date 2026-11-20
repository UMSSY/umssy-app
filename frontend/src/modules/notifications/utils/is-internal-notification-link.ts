export function isInternalNotificationLink(link: string | null | undefined): link is string {
  return typeof link === "string" && link.startsWith("/") && !link.startsWith("//") && !link.includes("\\");
}
