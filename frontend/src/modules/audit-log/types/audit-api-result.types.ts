export type AuditApiResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string };
