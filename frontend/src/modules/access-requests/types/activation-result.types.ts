import type { ActivationFailure } from "./activation-failure.types";

export type ActivationResult<T> = { ok: true; data: T } | ActivationFailure;
