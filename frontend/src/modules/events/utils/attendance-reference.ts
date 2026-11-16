export function parseAttendanceReference(input: string): string | null {
  const value = input.trim();
  const qr = /^v1:([a-f0-9]{64})$/i.exec(value);
  if (qr) return qr[1].toLowerCase();
  if (/^[a-f0-9]{64}$/i.test(value)) return value.toLowerCase();
  if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)) return value.toLowerCase();
  const compact = value.replace(/-/g, '');
  if (/^[a-z0-9-]+$/i.test(value) && /^[a-z0-9]{8,16}$/i.test(compact)) return compact.toUpperCase();
  return null;
}
