import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "@/shared/testing/create-query-wrapper";
import { surveyNotificationsService } from "../services/survey-notifications.service";
import { PendingSurveysBadge } from "./pending-surveys-badge";

describe("PendingSurveysBadge", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("cuenta solo las encuestas pendientes que se pueden responder", async () => {
    vi.spyOn(surveyNotificationsService, "getNotifications").mockResolvedValue([
      { id: "first", title: "Primera", publishedAt: "2026-10-15", status: "pending" },
      { id: "second", title: "Segunda", publishedAt: "2026-10-02", status: "pending" },
      { id: "expired", title: "Caducada", publishedAt: "2026-09-20", status: "expired" },
      { id: "answered", title: "Respondida", publishedAt: "2026-09-20", status: "answered" },
    ]);
    render(<PendingSurveysBadge />, createQueryWrapper());

    expect(await screen.findByLabelText("2 encuestas pendientes")).toHaveTextContent("2");
  });

  it("no muestra nada cuando no hay encuestas pendientes", async () => {
    const getNotifications = vi.spyOn(surveyNotificationsService, "getNotifications");
    const { container } = render(<PendingSurveysBadge />, createQueryWrapper());

    await vi.waitFor(() => expect(getNotifications).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
