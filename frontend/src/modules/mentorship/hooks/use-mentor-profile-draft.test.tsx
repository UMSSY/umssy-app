import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MentorProfileDraftProvider } from "../contexts/mentor-profile-draft-context";
import { useMentorProfileDraft } from "./use-mentor-profile-draft";

const wrapper = ({ children }: { children: ReactNode }) => (
  <MentorProfileDraftProvider>{children}</MentorProfileDraftProvider>
);

describe("useMentorProfileDraft", () => {
  it("empieza sin borrador", () => {
    const { result } = renderHook(() => useMentorProfileDraft(), { wrapper });
    expect(result.current.technicalAreaIds).toBeNull();
    expect(result.current.orientationTypeIds).toBeNull();
  });

  it("comparte el borrador entre consumidores y lo limpia", () => {
    const { result } = renderHook(
      () => ({ a: useMentorProfileDraft(), b: useMentorProfileDraft() }),
      { wrapper },
    );
    act(() => result.current.a.setTechnicalAreaIds(["x"]));
    expect(result.current.b.technicalAreaIds).toEqual(["x"]);
    act(() => result.current.b.clearAllDrafts());
    expect(result.current.a.technicalAreaIds).toBeNull();
  });

  it("funciona sin Provider con estado local", () => {
    const { result } = renderHook(() => useMentorProfileDraft());
    act(() => result.current.setOrientationTypeIds(["o"]));
    expect(result.current.orientationTypeIds).toEqual(["o"]);
  });
});