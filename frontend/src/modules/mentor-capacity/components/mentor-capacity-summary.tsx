import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card/card';

interface MentorCapacityMetricProps {
  label: string;
  value: number;
  detail: string;
  icon: LucideIcon;
}

export function MentorCapacityMetric({
  label,
  value,
  detail,
  icon: Icon,
}: MentorCapacityMetricProps) {
  return (
    <Card className="gap-2 p-5">
      <div className="flex items-center justify-between gap-2 text-sm text-text-secondary">
        <span>{label}</span>
        <Icon aria-hidden="true" className="size-4 shrink-0" />
      </div>
      <p className="font-tight text-3xl font-bold text-accent">{value}</p>
      <p className="text-xs text-text-secondary">{detail}</p>
    </Card>
  );
}
