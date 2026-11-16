'use client';

import { ArrowRight } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { useProfileGuide } from '../contexts/profile-guide-context';
import { ProfileCompletenessProgress } from './profile-completeness-progress';
import { ProfileGuideMascot } from './profile-guide-mascot';

export function ProfileGuideDashboardCard() {
  const guide = useProfileGuide();
  const showAssistant = Boolean(guide?.isEnabled);
  const needsFinalization = Boolean(
    showAssistant && guide?.isComplete && guide.hasFinished === false,
  );

  if (showAssistant && guide?.isComplete && !needsFinalization) return null;

  return (
    <section
      aria-label={
        showAssistant ? 'Tu perfil con el asistente UMSSY' : undefined
      }
      className={cn(
        showAssistant &&
          'grid overflow-hidden rounded-lg border border-border bg-surface lg:grid-cols-[minmax(0,1fr)_13rem]',
      )}
    >
      <div
        className={cn(
          'min-w-0',
          showAssistant &&
            '[&_[data-slot=card]]:rounded-none [&_[data-slot=card]]:border-0',
        )}
      >
        <ProfileCompletenessProgress
          refetchOnMount
          hideWhenComplete={!needsFinalization}
          showGuideAction={!showAssistant}
        />
        {showAssistant ? (
          <div className="px-4 pb-5 sm:px-5">
            <Button data-profile-guide-trigger onClick={() => guide?.start()}>
              {needsFinalization
                ? 'Finalizar mi perfil'
                : 'Continuar mi perfil'}
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        ) : null}
      </div>
      {showAssistant ? (
        <aside className="flex items-center gap-4 border-t border-border bg-interaction/50 px-4 py-5 sm:px-5 lg:flex-col lg:justify-center lg:border-t-0 lg:border-l lg:text-center">
          <Button
            type="button"
            variant="ghost"
            aria-label={
              needsFinalization
                ? 'Finalizar guía con el asistente UMSSY'
                : 'Abrir guía con el asistente UMSSY'
            }
            onClick={() => guide?.start()}
            className="size-32 shrink-0 rounded-xl p-0 hover:bg-interaction"
          >
            <ProfileGuideMascot
              pose={needsFinalization ? 'celebrate' : 'point'}
              size="md"
            />
          </Button>
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-semibold text-app-header">
              Asistente UMSSY
            </p>
            <p className="text-sm leading-relaxed text-ink">
              {needsFinalization
                ? '¡Tu perfil está completo! Finalicemos la guía para celebrar tu avance.'
                : '¡Vamos muy bien! Sigamos completando tu perfil.'}
            </p>
          </div>
        </aside>
      ) : null}
    </section>
  );
}
