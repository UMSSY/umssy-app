let fallbackSequence = 0;

export function createId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  fallbackSequence += 1;
  return `id-${Date.now()}-${fallbackSequence}`;
}
