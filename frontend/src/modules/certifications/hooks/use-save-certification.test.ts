import { renderHookWithQuery as renderHook } from "@/shared/testing/render-hook-with-query";
import { act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { certificationsService } from "../services/certifications.service";
import type { Certification } from "../types/certification.types";
import type { CertificationSaveResult } from "../types/certification-save-result.types";
import type { CertificationDocumentChange } from "../types/certification-document-change.types";
import { useSaveCertification } from "./use-save-certification";

vi.mock("../services/certifications.service", () => ({ certificationsService: {
  createCertification: vi.fn(), updateCertification: vi.fn(), createWithDocument: vi.fn(), updateWithDocument: vi.fn(), deleteCertification: vi.fn(),
} }));
const VALUES = { name: "CCNA", issuingOrganization: "Cisco", issueDate: "2024-01-15" };
const FILE = new File(["certificate"], "certificate.pdf", { type: "application/pdf" });
const REPLACE = { type: "replace", file: FILE } as const;
const SAVED: Certification = { id: "ccna", ...VALUES, hasDocument: true, createdAt: "2026-10-27T00:00:00Z", updatedAt: "2026-10-27T00:00:00Z" };
function renderSave() { const onPersisted = vi.fn(); return { ...renderHook(() => useSaveCertification({ onPersisted })), onPersisted }; }
async function save(hook: ReturnType<typeof renderSave>, id: string | null, change: CertificationDocumentChange = REPLACE) {
  let outcome: CertificationSaveResult = { status: "failed", fileError: null };
  await act(async () => { outcome = await hook.result.current.save(id, VALUES, change); });
  return outcome;
}
afterEach(() => vi.resetAllMocks());

describe("useSaveCertification atomic requests", () => {
  it("creates the fields and document in one request", async () => {
    vi.mocked(certificationsService.createWithDocument).mockResolvedValue(SAVED);
    const hook = renderSave();
    expect(await save(hook, null)).toEqual({ status: "saved" });
    expect(certificationsService.createWithDocument).toHaveBeenCalledWith(VALUES, FILE);
    expect(certificationsService.createCertification).not.toHaveBeenCalled();
    expect(certificationsService.deleteCertification).not.toHaveBeenCalled();
    expect(hook.onPersisted).toHaveBeenCalledOnce();
  });
  it("keeps the form unchanged and permits retry after an atomic create fails", async () => {
    vi.mocked(certificationsService.createWithDocument).mockRejectedValueOnce(new Error("unavailable")).mockResolvedValue(SAVED);
    const hook = renderSave();
    expect(await save(hook, null)).toEqual({ status: "failed", fileError: null });
    expect(hook.onPersisted).not.toHaveBeenCalled();
    expect(hook.result.current.feedback?.type).toBe("error");
    expect(await save(hook, null)).toEqual({ status: "saved" });
    expect(certificationsService.deleteCertification).not.toHaveBeenCalled();
  });
  it("edits fields and replaces the document together", async () => {
    vi.mocked(certificationsService.updateWithDocument).mockResolvedValue(SAVED);
    const hook = renderSave();
    expect(await save(hook, "ccna")).toEqual({ status: "saved" });
    expect(certificationsService.updateWithDocument).toHaveBeenCalledWith("ccna", VALUES, REPLACE);
    expect(certificationsService.updateCertification).not.toHaveBeenCalled();
  });
  it("does not report persisted changes when the combined update fails", async () => {
    vi.mocked(certificationsService.updateWithDocument).mockRejectedValue(new Error("invalid document"));
    const hook = renderSave();
    expect(await save(hook, "ccna")).toEqual({ status: "failed", fileError: null });
    expect(hook.onPersisted).not.toHaveBeenCalled();
    expect(certificationsService.updateCertification).not.toHaveBeenCalled();
  });
  it("removes the document in the same request as the edited fields", async () => {
    vi.mocked(certificationsService.updateWithDocument).mockResolvedValue(SAVED);
    const hook = renderSave();
    await save(hook, "ccna", { type: "remove" });
    expect(certificationsService.updateWithDocument).toHaveBeenCalledWith("ccna", VALUES, { type: "remove" });
  });
  it("keeps the existing document for an ordinary field update", async () => {
    vi.mocked(certificationsService.updateCertification).mockResolvedValue(SAVED);
    const hook = renderSave();
    await save(hook, "ccna", { type: "keep" });
    expect(certificationsService.updateCertification).toHaveBeenCalledWith("ccna", VALUES);
    expect(certificationsService.updateWithDocument).not.toHaveBeenCalled();
  });
  it("preserves the metadata-only API and clears feedback on reset", async () => {
    vi.mocked(certificationsService.createCertification).mockRejectedValue(new Error("unavailable"));
    const hook = renderSave();
    await save(hook, null, { type: "keep" });
    expect(certificationsService.createCertification).toHaveBeenCalledWith(VALUES);
    expect(hook.result.current.feedback?.type).toBe("error");
    act(() => hook.result.current.clearFeedback());
    expect(hook.result.current.feedback).toBeNull();
  });
});