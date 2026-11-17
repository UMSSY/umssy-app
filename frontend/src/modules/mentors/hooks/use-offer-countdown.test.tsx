import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useOfferCountdown } from "./use-offer-countdown";

function Countdown() {
  const { label } = useOfferCountdown("2026-11-18T12:00:00Z");
  return <span>{label}</span>;
}

afterEach(() => vi.useRealTimers());

describe("useOfferCountdown", () => {
  it("produce el mismo HTML inicial aunque cambie la hora de renderizado", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-17T11:59:58Z"));
    const first = renderToString(<Countdown />);
    vi.setSystemTime(new Date("2026-11-17T12:00:02Z"));
    expect(renderToString(<Countdown />)).toBe(first);
    expect(first).toContain("Calculando tiempo restante");
  });
});
