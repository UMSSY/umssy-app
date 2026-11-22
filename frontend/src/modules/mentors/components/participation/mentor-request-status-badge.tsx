import {
  CheckCircle2,
  CircleDot,
  CircleMinus,
  Clock3,
  TriangleAlert,
} from 'lucide-react';
import { getMentorRequestStatusLabel } from '../../utils/mentor-request-status';

type MentorRequestStatusBadgeProps = {
  status: string;
};

const STATUS_CONFIG = {
  PENDING: {
    icon: Clock3,
    className:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  OFFERED: {
    icon: CircleDot,
    className:
      'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300',
  },
  ACTIVE: {
    icon: CheckCircle2,
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  ENDED: {
    icon: CircleDot,
    className:
      'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  },
  CANCELLED: {
    icon: CircleMinus,
    className:
      'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  EXPIRED: {
    icon: TriangleAlert,
    className:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
  },
} as const;

export function MentorRequestStatusBadge({
  status,
}: MentorRequestStatusBadgeProps) {
  const config =
    STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ??
    STATUS_CONFIG.ENDED;

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${config.className}`}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {getMentorRequestStatusLabel(status)}
    </span>
  );
}
