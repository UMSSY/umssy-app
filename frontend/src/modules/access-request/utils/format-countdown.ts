// Segundos restantes hasta un instante ISO, corregidos con la diferencia entre el reloj del servidor y el del navegador
export function secondsUntil(targetIso: string | null, offsetMs: number, nowMs: number = Date.now()): number {
  if (!targetIso) return 0;
  const target = Date.parse(targetIso);
  if (Number.isNaN(target)) return 0;
  return Math.max(0, Math.ceil((target - (nowMs + offsetMs)) / 1000));
}

export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
