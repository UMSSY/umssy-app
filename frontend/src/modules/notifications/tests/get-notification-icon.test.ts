import { describe, expect, it } from "vitest";
import { DEFAULT_NOTIFICATION_CATALOG_DEFINITION, NOTIFICATION_CATALOG } from "../constants/notification-catalog.constants";
import { getNotificationIcon } from "../utils/get-notification-icon";

describe("getNotificationIcon", () => {
  it("devuelve el ícono asignado al tipo", () => {
    expect(getNotificationIcon("APPOINTMENT_BOOKED")).toBe(NOTIFICATION_CATALOG.APPOINTMENT_BOOKED.icon);
  });

  it("usa el ícono por defecto para tipos desconocidos", () => {
    expect(getNotificationIcon("NEW_FUTURE_TYPE")).toBe(DEFAULT_NOTIFICATION_CATALOG_DEFINITION.icon);
  });
});
