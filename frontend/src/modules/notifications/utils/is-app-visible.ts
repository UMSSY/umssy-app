export function isAppVisible(): boolean {
  return typeof document !== "undefined" && document.visibilityState === "visible";
}
