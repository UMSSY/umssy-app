export function requestCodePrefix(year: number): string {
  return `SOL-${year}-`;
}

export function nextRequestCode(
  year: number,
  lastCode: string | null | undefined,
): string {
  const prefix = requestCodePrefix(year);
  const lastNumber = lastCode?.startsWith(prefix)
    ? Number.parseInt(lastCode.slice(prefix.length), 10)
    : 0;
  const next = (Number.isNaN(lastNumber) ? 0 : lastNumber) + 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
}

export function randomRetryDelayMs(random: () => number = Math.random): number {
  return 5 + Math.floor(random() * (40 - 5 + 1));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
