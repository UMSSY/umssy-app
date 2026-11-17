import { Badge } from '@/components/ui/badge';

import type { ReviewStatusBadgeProps } from '../types/review-status-badge-props.types';

export function ReviewStatusBadge({ status }: ReviewStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className="border-border bg-transparent text-text-secondary"
    >
      {status}
    </Badge>
  );
}
