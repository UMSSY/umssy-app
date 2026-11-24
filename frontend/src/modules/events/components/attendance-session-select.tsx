import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { formatSessionLabel, formatSessionTimeRange } from '../utils/event-sessions';
import type { AttendanceSessionSelectProps } from '../types/attendance-session-select-props.types';

// Sesión a la que se registra la asistencia en un taller multisesión.
export function AttendanceSessionSelect({ sessions, value, onChange, disabled }: AttendanceSessionSelectProps) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-surface p-4">
      <Label htmlFor="attendance-session" className="block text-sm font-semibold text-ink">
        Sesión
      </Label>
      <NativeSelect
        id="attendance-session"
        className="w-full"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {sessions.map((session) => (
          <NativeSelectOption key={session.id} value={session.id}>
            {formatSessionLabel(sessions, session)} · {formatSessionTimeRange(session)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}
