import { describe, expect, it } from "vitest";
import { channelToPreferences } from "../utils/channel-to-preferences";
import { preferencesToChannel } from "../utils/preferences-to-channel";

describe("channelToPreferences", () => {
  it.each([
    ["push", { pushEnabled: true, emailEnabled: false, inAppEnabled: true }],
    ["email", { pushEnabled: false, emailEnabled: true, inAppEnabled: true }],
    ["in-app", { pushEnabled: false, emailEnabled: false, inAppEnabled: true }],
  ] as const)("convierte %s en los tres booleanos y deja la campana activa", (channel, expected) => {
    expect(channelToPreferences(channel)).toEqual(expected);
  });
});

describe("preferencesToChannel", () => {
  it("devuelve push cuando pushEnabled está activo", () => {
    expect(preferencesToChannel({ pushEnabled: true, emailEnabled: false, inAppEnabled: true })).toBe("push");
  });

  it("devuelve email para la configuración por defecto de una cuenta nueva", () => {
    expect(preferencesToChannel({ pushEnabled: false, emailEnabled: true, inAppEnabled: true })).toBe("email");
  });

  it("devuelve in-app cuando solo queda la campana", () => {
    expect(preferencesToChannel({ pushEnabled: false, emailEnabled: false, inAppEnabled: true })).toBe("in-app");
  });

  it.each(["push", "email", "in-app"] as const)("es la inversa de channelToPreferences para %s", (channel) => {
    expect(preferencesToChannel(channelToPreferences(channel))).toBe(channel);
  });
});
