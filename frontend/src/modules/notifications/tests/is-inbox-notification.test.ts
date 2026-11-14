import { describe, expect, it } from "vitest";
import { isInboxNotification } from "../utils/is-inbox-notification";

describe("isInboxNotification", () => {
  it("excluye los mensajes de chat de la bandeja", () => {
    expect(isInboxNotification("CHAT_MESSAGE")).toBe(false);
    expect(isInboxNotification("CHAT_GROUP_MESSAGE")).toBe(false);
  });

  it("incluye el resto de avisos", () => {
    expect(isInboxNotification("CONNECTION_REQUEST_RECEIVED")).toBe(true);
    expect(isInboxNotification("NEW_FUTURE_TYPE")).toBe(true);
  });
});
