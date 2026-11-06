import { createHash } from 'node:crypto';

export class FixtureContext {
  private readonly references = new Map<string, string>();

  constructor(
    readonly anchor: Date,
    readonly adminId: string,
  ) {}

  getId(key: string): string {
    const bytes = createHash('sha256')
      .update(`umssy-fixtures-v1:${key}`)
      .digest()
      .subarray(0, 16);
    bytes[6] = (bytes[6]! & 0x0f) | 0x40;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;
    const hex = bytes.toString('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  setReference(table: string, value: string, id: string): void {
    this.references.set(`${table}:${value}`, id);
  }

  getReference(table: string, value: string): string {
    const id = this.references.get(`${table}:${value}`);
    if (!id) throw new Error(`No existe el catálogo ${table}: ${value}`);
    return id;
  }

  getDate(
    base: 'anchor' | 'monday',
    minutes: number,
    isDateOnly: boolean,
  ): Date {
    const date = new Date(this.anchor);
    if (base === 'monday') {
      date.setTime(date.getTime() - 4 * 3_600_000);
      date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
      date.setUTCHours(4, 0, 0, 0);
    }
    date.setTime(date.getTime() + minutes * 60_000);
    if (isDateOnly) {
      date.setTime(date.getTime() - 4 * 3_600_000);
      date.setUTCHours(0, 0, 0, 0);
    }
    return date;
  }
}
