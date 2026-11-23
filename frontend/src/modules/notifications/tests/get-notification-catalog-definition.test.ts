import { describe, expect, it } from "vitest";
import { DEFAULT_NOTIFICATION_CATALOG_DEFINITION, NOTIFICATION_CATALOG } from "../constants/notification-catalog.constants";
import { getNotificationCatalogDefinition } from "../utils/get-notification-catalog-definition";

describe("getNotificationCatalogDefinition", () => {
  it("devuelve la definición del tipo", () => {
    expect(getNotificationCatalogDefinition("SURVEY_PUBLISHED")).toBe(NOTIFICATION_CATALOG.SURVEY_PUBLISHED);
  });

  it("usa la definición por defecto para códigos desconocidos", () => {
    expect(getNotificationCatalogDefinition("NEW_FUTURE_TYPE")).toBe(DEFAULT_NOTIFICATION_CATALOG_DEFINITION);
    expect(getNotificationCatalogDefinition("toString")).toBe(DEFAULT_NOTIFICATION_CATALOG_DEFINITION);
  });
});
