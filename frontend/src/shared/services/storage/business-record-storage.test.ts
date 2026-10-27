import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateIndexedDb } from "./browser-indexed-db";
import { updateBusinessRecord } from "./business-record-storage";
import { BusinessRecordStorageError } from "./business-record-storage-error";

vi.mock("./browser-indexed-db", () => ({ updateIndexedDb: vi.fn() }));

beforeEach(() => { vi.mocked(updateIndexedDb).mockReset(); });

describe("registros de negocio persistentes", () => {
  it("propaga la falla de almacenamiento sin ejecutar un respaldo en memoria", async () => {
    const cause = new Error("QuotaExceededError");
    vi.mocked(updateIndexedDb).mockRejectedValueOnce(cause);
    const update = vi.fn(() => "value");
    await expect(updateBusinessRecord("record", update)).rejects.toMatchObject({
      name: "BusinessRecordStorageError", cause,
    });
    expect(update).not.toHaveBeenCalled();
    expect(updateIndexedDb).toHaveBeenCalledTimes(1);
  });

  it("serializa el mismo registro hasta que termine la transacción persistente", async () => {
    let complete!: (value: unknown) => void;
    vi.mocked(updateIndexedDb)
      .mockImplementationOnce(() => new Promise((resolve) => { complete = resolve; }))
      .mockResolvedValueOnce("second");
    const first = updateBusinessRecord("record", () => "first");
    const second = updateBusinessRecord("record", () => "second");
    await vi.waitFor(() => expect(updateIndexedDb).toHaveBeenCalledTimes(1));
    complete("first");
    await expect(first).resolves.toBe("first");
    await expect(second).resolves.toBe("second");
    expect(updateIndexedDb).toHaveBeenCalledTimes(2);
  });

  it("permite recuperar un registro después de una transacción fallida", async () => {
    vi.mocked(updateIndexedDb).mockRejectedValueOnce(new Error("AbortError")).mockResolvedValueOnce("saved");
    const first = updateBusinessRecord("record", () => "failed");
    const second = updateBusinessRecord("record", () => "saved");
    await expect(first).rejects.toBeInstanceOf(BusinessRecordStorageError);
    await expect(second).resolves.toBe("saved");
  });
});
