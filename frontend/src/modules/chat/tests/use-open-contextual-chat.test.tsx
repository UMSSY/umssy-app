import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createQueryClient } from "@/shared/services/query-client";
import { CONVERSATIONS_QUERY_KEY } from "../constants/conversations-query-key";
import { MessagingUiProvider, useMessagingUi } from "../contexts/messaging-ui-context";
import { useOpenContextualChat } from "../hooks/use-open-contextual-chat";
import * as chatApi from "../services/chat-api";
import type { Conversation } from "../types/conversation.types";

const CONTEXT = { contextType: "POSTULACION", contextId: "app-carlos" };

const CONVERSATION: Conversation = {
  id: "conversation-carlos",
  contact: { id: "user-carlos", fullName: "Carlos Mendoza Ríos", isOnline: false, academicTitle: null },
  unreadCount: 0,
  updatedAt: "2026-11-20T20:00:00.000Z",
  contextType: "POSTULACION",
  contextId: "app-carlos",
};

function setup(initial?: Conversation[]) {
  const client = createQueryClient();
  if (initial) client.setQueryData(CONVERSATIONS_QUERY_KEY, initial);
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <MessagingUiProvider>{children}</MessagingUiProvider>
      </QueryClientProvider>
    );
  }
  const view = renderHook(() => ({ chat: useOpenContextualChat(), ui: useMessagingUi() }), { wrapper: Wrapper });
  return { ...view, client };
}

describe("useOpenContextualChat", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("crea la conversación, la guarda en la caché del chat y abre el panel", async () => {
    const create = vi.spyOn(chatApi, "getOrCreateConversation").mockResolvedValue(CONVERSATION);
    const { result, client } = setup();

    await act(async () => {
      await result.current.chat.openContextualChat({
        contactId: "user-carlos",
        context: CONTEXT,
        contactHeadline: "Senior Software Engineer",
        launcherId: "contact-button",
      });
    });

    expect(create).toHaveBeenCalledWith("user-carlos", CONTEXT);
    const cached = client.getQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY);
    expect(cached?.[0].id).toBe("conversation-carlos");
    expect(cached?.[0].contact?.headline).toBe("Senior Software Engineer");
    expect(cached?.[0].contact?.academicTitle).toBeNull();
    expect(result.current.ui?.selectedId).toBe("conversation-carlos");
    expect(result.current.ui?.isPanelOpen).toBe(true);
    expect(result.current.ui?.launcherId).toBe("contact-button");
    await waitFor(() => expect(result.current.chat.isOpening).toBe(false));
  });

  it("reutiliza la conversación de la postulación que ya está en la lista", async () => {
    const create = vi.spyOn(chatApi, "getOrCreateConversation");
    const { result, client } = setup([CONVERSATION]);

    await act(async () => {
      await result.current.chat.openContextualChat({ contactId: "user-carlos", context: CONTEXT });
    });

    expect(create).not.toHaveBeenCalled();
    expect(client.getQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY)).toHaveLength(1);
    expect(result.current.ui?.selectedId).toBe("conversation-carlos");
  });

  it("propaga el error y no abre el panel si no se puede crear la conversación", async () => {
    vi.spyOn(chatApi, "getOrCreateConversation").mockRejectedValue(new Error("sin conexión"));
    const { result } = setup();

    await act(async () => {
      await expect(
        result.current.chat.openContextualChat({ contactId: "user-carlos", context: CONTEXT }),
      ).rejects.toThrow("sin conexión");
    });

    expect(result.current.ui?.isPanelOpen).toBe(false);
    await waitFor(() => expect(result.current.chat.isOpening).toBe(false));
  });
});
