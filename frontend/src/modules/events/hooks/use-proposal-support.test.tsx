import { act, cleanup, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { InfiniteData } from "@tanstack/react-query";
import { renderHookWithQuery } from "@/shared/testing/render-hook-with-query";
import { clearAccessToken, saveAccessToken } from "@/shared/services/storage/access-token-storage";
import { REGISTRATION_QUERY_KEYS } from "@/modules/registrations";
import { registrationsService } from "../services/registrations.service";
import type { EventItem } from "../types/event-item.types";
import type { EventDetail } from "../types/event-detail.types";
import type { EventsListResponse } from "../types/events-list-response.types";
import type { ProposalSupportResponse } from "../types/proposal-support-response.types";
import { useProposalSupport } from "./use-proposal-support";

vi.mock("../services/registrations.service", () => ({
  registrationsService: { supportProposal: vi.fn() },
}));

const proposal: EventItem = {
  id: "proposal-1",
  title: "Visualización de datos",
  category: { id: "category-1", name: "Tecnología" },
  description: null,
  instructorName: null,
  eventDate: "2026-10-30",
  startTime: "09:00",
  endTime: "13:00",
  location: null,
  capacity: 20,
  availableSpots: 6,
  registrationCount: 14,
  statusId: "voting-status",
  modalityId: "onsite",
  status: "voting",
  supportThreshold: 20,
  supportCount: 14,
  supportsRemaining: 6,
  progressPercent: 70,
  hasSupported: false,
};

const votingResponse: ProposalSupportResponse = {
  eventId: proposal.id,
  status: "voting",
  supportCount: 15,
  supportThreshold: 20,
  supportsRemaining: 5,
  progressPercent: 75,
  hasSupported: true,
};

const listKey = ["events", "list", "token-a", "", ""];
const filteredListKey = ["events", "list", "token-a", "datos", "category-1"];
const detailKey = ["events", "detail", proposal.id, "token-a"];
const passesKey = [...REGISTRATION_QUERY_KEYS.passes, "token-a"];

function listWith(...pages: EventItem[][]): InfiniteData<EventsListResponse> {
  return {
    pages: pages.map((data, index) => ({ data, page: index + 1, offset: index * 50 })),
    pageParams: pages.map((_, index) => index + 1),
  };
}

beforeEach(() => {
  saveAccessToken("token-a");
});

afterEach(() => {
  cleanup();
  clearAccessToken();
  vi.resetAllMocks();
});

describe("useProposalSupport", () => {
  it("synchronizes all loaded list pages and the detail after a 201", async () => {
    vi.mocked(registrationsService.supportProposal).mockResolvedValue(votingResponse);
    const { result, client } = renderHookWithQuery(() => useProposalSupport(proposal.id));
    const other = { ...proposal, id: "proposal-2" };
    client.setQueryData(listKey, listWith([other], [proposal]));
    client.setQueryData(filteredListKey, listWith([proposal]));
    client.setQueryData(detailKey, { ...proposal, modality: { id: "onsite", title: "Presencial" } });
    const invalidate = vi.spyOn(client, "invalidateQueries");

    await act(async () => { await result.current.support(); });

    const pages = client.getQueryData<InfiniteData<EventsListResponse>>(listKey)!;
    expect(pages.pageParams).toEqual([1, 2]);
    expect(pages.pages[0].data[0]).toEqual(other);
    expect(pages.pages[1].data[0]).toMatchObject({
      status: "voting", supportCount: 15, registrationCount: 15,
      supportsRemaining: 5, progressPercent: 75, hasSupported: true,
      availableSpots: 5,
    });
    expect(client.getQueryData<InfiniteData<EventsListResponse>>(filteredListKey)!.pages[0].data[0].hasSupported).toBe(true);
    expect(client.getQueryData<EventDetail>(detailKey)).toMatchObject({
      supportCount: 15, hasSupported: true, availableSpots: 5,
      modality: { id: "onsite", title: "Presencial" },
    });
    expect(registrationsService.supportProposal).toHaveBeenCalledWith(proposal.id, "token-a");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["events", "list", "token-a"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: detailKey, exact: true });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: passesKey, exact: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("publishes at the threshold and refreshes passes without fabricating one", async () => {
    vi.mocked(registrationsService.supportProposal).mockResolvedValue({
      ...votingResponse, status: "Publicado", supportCount: 20,
      supportsRemaining: 0, progressPercent: 100,
    });
    const { result, client } = renderHookWithQuery(() => useProposalSupport(proposal.id));
    client.setQueryData(listKey, listWith([{ ...proposal, supportCount: 19, registrationCount: 19 }]));
    client.setQueryData(detailKey, { ...proposal, modality: { id: "onsite", title: "Presencial" } });
    client.setQueryData(passesKey, []);
    const invalidate = vi.spyOn(client, "invalidateQueries");

    await act(async () => { await result.current.support(); });

    expect(client.getQueryData<InfiniteData<EventsListResponse>>(listKey)!.pages[0].data[0]).toMatchObject({
      status: "Publicado", supportCount: 20, registrationCount: 20,
      supportsRemaining: 0, progressPercent: 100, availableSpots: 0, hasSupported: true,
    });
    expect(client.getQueryData<EventDetail>(detailKey)?.status).toBe("Publicado");
    expect(client.getQueryData(passesKey)).toEqual([]);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: passesKey, exact: true });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: REGISTRATION_QUERY_KEYS.own(proposal.id, "token-a"), exact: true,
    });
  });

  it("leaves caches unchanged on an error and exposes its code", async () => {
    vi.mocked(registrationsService.supportProposal).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: { statusCode: 409, ok: false, data: null, code: "ALREADY_SUPPORTED", detail: "Private detail" },
      },
    });
    const { result, client } = renderHookWithQuery(() => useProposalSupport(proposal.id));
    const before = listWith([proposal]);
    client.setQueryData(listKey, before);
    client.setQueryData(detailKey, proposal);
    const invalidate = vi.spyOn(client, "invalidateQueries");

    await act(async () => { await result.current.support(); });

    expect(client.getQueryData(listKey)).toEqual(before);
    expect(client.getQueryData(detailKey)).toEqual(proposal);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["events", "list", "token-a"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: detailKey, exact: true });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: REGISTRATION_QUERY_KEYS.own(proposal.id, "token-a"), exact: true,
    });
    await waitFor(() => expect(result.current.errorCode).toBe("ALREADY_SUPPORTED"));
    expect(result.current.error).toBe("Tu apoyo ya fue registrado. No puedes preinscribirte dos veces.");
    expect(registrationsService.supportProposal).toHaveBeenCalledTimes(1);
  });

  it("keeps the cached proposal on a network failure and offers a retryable error", async () => {
    vi.mocked(registrationsService.supportProposal).mockRejectedValue(new Error("offline"));
    const { result, client } = renderHookWithQuery(() => useProposalSupport(proposal.id));
    client.setQueryData(listKey, listWith([proposal]));
    const invalidate = vi.spyOn(client, "invalidateQueries");

    await act(async () => { await result.current.support(); });

    expect(client.getQueryData<InfiniteData<EventsListResponse>>(listKey)!.pages[0].data[0]).toEqual(proposal);
    expect(invalidate).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.error).toBe("No pudimos registrar tu apoyo. Revisa la conexión e inténtalo nuevamente."));
  });

  it("submits only once on rapid repeated actions", async () => {
    let resolve!: (value: ProposalSupportResponse) => void;
    vi.mocked(registrationsService.supportProposal).mockImplementation(
      () => new Promise((done) => { resolve = done; }),
    );
    const { result } = renderHookWithQuery(() => useProposalSupport(proposal.id));

    act(() => { void result.current.support(); void result.current.support(); });
    await waitFor(() => expect(registrationsService.supportProposal).toHaveBeenCalledTimes(1));
    await act(async () => { resolve(votingResponse); });
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it("cancels an older detail lookup before applying the accepted support", async () => {
    vi.mocked(registrationsService.supportProposal).mockResolvedValue(votingResponse);
    const { result, client } = renderHookWithQuery(() => useProposalSupport(proposal.id));
    client.setQueryData(detailKey, { ...proposal, modality: { id: "onsite", title: "Presencial" } });
    let resolveOld!: (value: EventDetail) => void;
    const pending = client.fetchQuery({
      queryKey: detailKey,
      queryFn: () => new Promise<EventDetail>((done) => { resolveOld = done; }),
    }).catch(() => null);

    await act(async () => { await result.current.support(); });
    expect(client.getQueryData<EventDetail>(detailKey)?.hasSupported).toBe(true);
    resolveOld({ ...proposal, modality: { id: "onsite", title: "Presencial" } });
    await pending;
    expect(client.getQueryData<EventDetail>(detailKey)?.hasSupported).toBe(true);
  });

  it("ignores an old session response without touching either account cache", async () => {
    let resolve!: (value: ProposalSupportResponse) => void;
    vi.mocked(registrationsService.supportProposal).mockImplementation(
      () => new Promise((done) => { resolve = done; }),
    );
    const { result, client } = renderHookWithQuery(() => useProposalSupport(proposal.id));
    client.setQueryData(listKey, listWith([proposal]));
    client.setQueryData(["events", "list", "token-b", "", ""], listWith([proposal]));
    const invalidate = vi.spyOn(client, "invalidateQueries");
    act(() => { void result.current.support(); });
    await waitFor(() => expect(registrationsService.supportProposal).toHaveBeenCalledTimes(1));
    act(() => { saveAccessToken("token-b"); });

    await act(async () => { resolve(votingResponse); });

    expect(client.getQueryData<InfiniteData<EventsListResponse>>(listKey)!.pages[0].data[0].hasSupported).toBe(false);
    expect(client.getQueryData<InfiniteData<EventsListResponse>>(["events", "list", "token-b", "", ""])!.pages[0].data[0].hasSupported).toBe(false);
    expect(invalidate).not.toHaveBeenCalled();
    expect(result.current.isSuccess).toBe(false);
  });

  it("does not send a request without a selected proposal or session", async () => {
    clearAccessToken();
    const { result } = renderHookWithQuery(() => useProposalSupport(null));
    await act(async () => { await result.current.support(); });
    expect(registrationsService.supportProposal).not.toHaveBeenCalled();
  });
});
