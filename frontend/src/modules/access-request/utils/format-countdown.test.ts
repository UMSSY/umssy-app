import { describe, expect, it } from "vitest";
import { formatCountdown, secondsUntil } from "./format-countdown";
import { maskEmail } from "./mask-email";
import { sanitizeOtp } from "./sanitize-otp";

describe("format-countdown", () => {
  it("formatea mm:ss", () => {
    expect(formatCountdown(125)).toBe("02:05");
    expect(formatCountdown(-3)).toBe("00:00");
  });

  it("calcula segundos con el desfase del servidor", () => {
    const target = "2026-10-05T12:10:00.000Z";
    const now = Date.parse("2026-10-05T12:00:00.000Z");
    expect(secondsUntil(target, 0, now)).toBe(600);
    expect(secondsUntil(target, 60_000, now)).toBe(540);
    expect(secondsUntil(null, 0, now)).toBe(0);
    expect(secondsUntil("nope", 0, now)).toBe(0);
    expect(secondsUntil(target, 0, now + 700_000)).toBe(0);
  });

  it("enmascara el correo y limpia el código", () => {
    expect(maskEmail("keyla@gmail.com")).toBe("ke***@gmail.com");
    expect(maskEmail("a@x.com")).toBe("a***@x.com");
    expect(maskEmail("sin-arroba")).toBe("sin-arroba");
    expect(sanitizeOtp("12 34-56789")).toBe("123456");
  });
});
