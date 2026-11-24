import type { FieldErrors } from "./field-errors.types";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; fieldErrors: FieldErrors; message: string };
