export function isRefForCv(ref: unknown, cvId: string): boolean {
  if (!cvId) return false;
  if (typeof ref === 'string') {
    return ref === cvId || ref === `cv:${cvId}`;
  }
  if (typeof ref === 'object' && ref !== null) {
    const candidate = ref as { type?: unknown; id?: unknown };
    return candidate.type === 'cv' && candidate.id === cvId;
  }
  return false;
}
