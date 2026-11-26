export function assignWindowLocation(url: string): void {
  if (typeof window !== "undefined" && (url ?? "").trim().length > 0) {
    window.location.assign(url);
  }
}

