import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notifications.service";

vi.mock("@/shared/services/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

function createAxiosResponse<T>(data: T) {
  return {
    data,
    status: 200,
    statusText: "OK",
    headers: {},
    config: {},
  } as never;
}

describe("notifications.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("obtiene la lista paginada de notificaciones sin filtro cuando es ALL", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(
      createAxiosResponse({
        data: {
          data: [
            {
              id: "1",
              title: "Aviso",
              body: "Detalle",
              link: "/dashboard",
              readAt: null,
              createdAt: "2026-11-15T10:00:00Z",
              typeCode: "SURVEY_PUBLISHED",
            },
          ],
          page: 1,
          limit: 8,
          total: 1,
        },
      }),
    );

    const result = await getNotifications({ page: 1, limit: 8, filter: "ALL" });

    expect(apiClient.get).toHaveBeenCalledWith("/notifications", {
      params: { page: 1, limit: 8 },
    });
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("envía el parámetro filter cuando se filtra por categoría", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(
      createAxiosResponse({ data: { data: [], page: 2, limit: 8 } }),
    );

    await getNotifications({ page: 2, limit: 8, filter: "SURVEYS" });

    expect(apiClient.get).toHaveBeenCalledWith("/notifications", {
      params: { page: 2, limit: 8, filter: "SURVEYS" },
    });
  });

  it("obtiene el contador de notificaciones sin leer", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(createAxiosResponse({ data: { count: 7 } }));

    const result = await getUnreadCount();

    expect(apiClient.get).toHaveBeenCalledWith("/notifications/unread-count");
    expect(result).toEqual({ count: 7 });
  });

  it("marca una notificación individual como leída", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(createAxiosResponse(undefined));

    await markNotificationAsRead("notif-42");

    expect(apiClient.patch).toHaveBeenCalledWith("/notifications/notif-42/read");
  });

  it("codifica el id al marcar una notificación como leída", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(createAxiosResponse(undefined));

    await markNotificationAsRead("id/raro");

    expect(apiClient.patch).toHaveBeenCalledWith("/notifications/id%2Fraro/read");
  });

  it("marca todas las notificaciones como leídas", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(createAxiosResponse(undefined));

    await markAllNotificationsAsRead("REMINDERS");

    expect(apiClient.patch).toHaveBeenCalledWith("/notifications/read-all", {
      filter: "REMINDERS",
    });
  });
});