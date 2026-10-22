import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "@/shared/testing/create-query-wrapper";
import { surveysService } from "../services/surveys.service";
import { PendingSurveysBadge } from "./pending-surveys-badge";

describe("PendingSurveysBadge", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("cuenta solo las encuestas pendientes que se pueden responder", async () => {
    render(<PendingSurveysBadge />, createQueryWrapper());

    expect(await screen.findByLabelText("2 encuestas pendientes")).toHaveTextContent("2");
  });

  it("no muestra nada cuando no hay encuestas pendientes", async () => {
    const getNotifications = vi.spyOn(surveysService, "getNotifications").mockResolvedValue([]);
    const { container } = render(<PendingSurveysBadge />, createQueryWrapper());

    await vi.waitFor(() => expect(getNotifications).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
