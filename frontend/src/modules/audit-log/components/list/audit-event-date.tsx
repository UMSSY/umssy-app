import { EMPTY_VALUE } from "../../constants/audit-log.constants";
import type { AuditEventDateProps } from "../../types/audit-log-component-props.types";
import { formatBoliviaDateTime } from "../../utils/format-bolivia-date-time";

export function AuditEventDate({ occurredAt, inline = false }: AuditEventDateProps) {
  const value = formatBoliviaDateTime(occurredAt);
  if (!value) return <span className="text-text-secondary">{EMPTY_VALUE}</span>;

  if (inline) {
    return (
      <time dateTime={occurredAt} className="text-[12.5px] whitespace-nowrap text-text-secondary">
        {value.date} · {value.time}
      </time>
    );
  }
  return (
    <time dateTime={occurredAt} className="flex flex-col">
      <span className="font-medium text-ink">{value.date}</span>
      <span className="text-[12.5px] text-text-secondary">{value.time}</span>
    </time>
  );
}
