import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MessagingUiProvider, useMessagingUi } from "./messaging-ui-context";

describe("MessagingUiProvider", () => {
  it("does not erase a newer draft when an older send completes", () => {
    const { result } = renderHook(() => useMessagingUi(), { wrapper: MessagingUiProvider });
    act(() => result.current!.setDraft("conversation-1", "Primer mensaje"));
    act(() => result.current!.setDraft("conversation-1", "Borrador posterior"));
    act(() => result.current!.clearSubmittedDraft("conversation-1", "Primer mensaje"));
    expect(result.current!.drafts["conversation-1"]).toBe("Borrador posterior");
    act(() => result.current!.clearSubmittedDraft("conversation-1", "Borrador posterior"));
    expect(result.current!.drafts["conversation-1"]).toBe("");
  });
});
