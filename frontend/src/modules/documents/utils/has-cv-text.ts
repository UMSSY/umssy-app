export function hasCvText(value: string | null | undefined): value is string {
  return (value ?? "").trim().length > 0;
}
