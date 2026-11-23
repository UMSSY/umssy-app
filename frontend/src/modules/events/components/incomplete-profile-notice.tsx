import Link from 'next/link';
import { UserRoundPen } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button-variants';
import { INCOMPLETE_PROFILE_NOTICE } from '../constants/workshop-recommendations.constants';

export function IncompleteProfileNotice() {
  return (
    <section
      aria-labelledby="incomplete-profile-notice-title"
      className="flex flex-col gap-4 rounded-lg border border-dashed border-border-strong bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-soft text-ink">
          <UserRoundPen className="size-5" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h2
            id="incomplete-profile-notice-title"
            className="text-sm font-bold text-ink"
          >
            {INCOMPLETE_PROFILE_NOTICE.title}
          </h2>
          <p className="text-sm text-text-secondary">
            {INCOMPLETE_PROFILE_NOTICE.text}
          </p>
        </div>
      </div>
      <Link
        href={INCOMPLETE_PROFILE_NOTICE.href}
        className={buttonVariants({ variant: 'outline' })}
      >
        {INCOMPLETE_PROFILE_NOTICE.action}
      </Link>
    </section>
  );
}
