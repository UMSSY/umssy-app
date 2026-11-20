import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/shared/utils/get-initials';

import { ReviewStatusBadge } from './review-status-badge';

import type { ReviewProfileListProps } from '../types/review-profile-list-props.types';

export function ReviewProfileList({
  profiles,
  selectedProfileId,
  onProfileSelect,
}: ReviewProfileListProps) {
  return (
    <div className="p-5">
      <p className="mb-4 text-sm text-text-secondary">
        Mostrando {profiles.length} perfil(es)
      </p>

      <div className="space-y-3">
        {profiles.map((profile) => {
          const isSelected = selectedProfileId === profile.id;

          return (
            <Button
              key={profile.id}
              type="button"
              variant="ghost"
              onClick={() => onProfileSelect(profile)}
              aria-pressed={isSelected}
              className={cn(
                'h-auto w-full justify-start rounded-lg border p-4 text-left whitespace-normal transition-colors',
                isSelected
                  ? 'border-brand-red bg-brand-soft text-ink hover:bg-brand-soft'
                  : 'border-border bg-surface text-ink hover:bg-interaction',
              )}
            >
              <div className="flex w-full min-w-0 items-start gap-3">
                <div
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-interaction text-sm font-semibold text-accent"
                  aria-label={`Avatar de ${profile.fullName}`}
                >
                  {getInitials(profile.fullName)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">
                        {profile.fullName}
                      </p>

                      <p className="mt-1 text-xs text-text-secondary">
                        {profile.targetPosition}
                      </p>
                    </div>

                    <ReviewStatusBadge status={profile.status} />
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs text-text-secondary">
                        Fecha de envío
                      </p>

                      <p className="mt-0.5 text-xs font-medium text-ink-soft">
                        {profile.submittedAt}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-text-secondary">Afinidad</p>

                      <p className="mt-0.5 text-sm font-semibold text-ink">
                        {profile.globalAffinity.toFixed(1)}/10
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
