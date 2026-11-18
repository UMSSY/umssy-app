import { describe, expect, it } from "vitest";
import { parseNotificationOpenParams } from "../utils/parse-notification-open-params";

describe("parseNotificationOpenParams", () => {
  it("devuelve el id y el destino interno", () => {
    expect(parseNotificationOpenParams("?id=n1&to=%2Fchat%3FconversationId%3Dabc")).toEqual({
      notificationId: "n1",
      destination: "/chat?conversationId=abc",
    });
  });

  it("usa /dashboard si el destino es externo o falta", () => {
    expect(parseNotificationOpenParams("?id=n1&to=https%3A%2F%2Fexample.com").destination).toBe("/dashboard");
    expect(parseNotificationOpenParams("?id=n1&to=%2F%2Fexample.com").destination).toBe("/dashboard");
    expect(parseNotificationOpenParams("?id=n1").destination).toBe("/dashboard");
  });

  it("evita volver a la misma ruta de apertura", () => {
    expect(parseNotificationOpenParams("?to=%2Fnotifications%2Fopen%3Fid%3Dn1").destination).toBe("/dashboard");
  });

  it("devuelve null si no hay id", () => {
    expect(parseNotificationOpenParams("?to=%2Fappointments").notificationId).toBeNull();
  });
});
