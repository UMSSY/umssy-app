'use client';

// Temporary preview of the profile guide animations (HU-3.1). Remove this
// view, its page in app/(public)/profile-guide-preview and its re-export once
// the guide is integrated.

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileGuideBubble } from '../components/profile-guide-bubble';
import { ProfileGuideCelebration } from '../components/profile-guide-celebration';
import { ProfileGuideMascot } from '../components/profile-guide-mascot';
import { ProfileGuidePop } from '../components/profile-guide-pop';
import { ProfileGuideReveal } from '../components/profile-guide-reveal';
import { ProfileGuideWelcomeHero } from '../components/profile-guide-welcome-hero';
import { useCountUp } from '../hooks/use-count-up';
import type { ProfileGuidePose } from '../types/profile-guide-pose.types';
import type { ProfileGuideStepDirection } from '../types/profile-guide-step-direction.types';

const PREVIEW_POSES: { pose: ProfileGuidePose; label: string }[] = [
  { pose: 'wave', label: 'Saludar' },
  { pose: 'point', label: 'Señalar' },
  { pose: 'fly', label: 'Volar' },
  { pose: 'celebrate', label: 'Festejar' },
];

const PREVIEW_MESSAGES = [
  'Hola, soy tu asistente. Te ayudo a completar tu perfil.',
  'Empieza por tus datos de contacto.',
  'Ya casi terminas. Sube tu CV para llegar al 100%.',
];

function CelebrationPreview() {
  const percentage = useCountUp(100);

  return (
    <div className="flex flex-wrap items-center gap-6">
      <ProfileGuideCelebration />
      <p className="font-heading text-3xl font-bold text-app-header">
        {percentage}%
      </p>
    </div>
  );
}

export function ProfileGuidePreviewView() {
  const [welcomeRun, setWelcomeRun] = useState(0);
  const [pose, setPose] = useState<ProfileGuidePose>('point');
  const [step, setStep] = useState<{
    key: number;
    direction: ProfileGuideStepDirection;
  }>({ key: 0, direction: 'forward' });
  const [celebrationKey, setCelebrationKey] = useState(0);
  const [isTalking, setIsTalking] = useState(false);
  const [isSectionDone, setIsSectionDone] = useState(false);
  const [celebrationRun, setCelebrationRun] = useState(0);
  const [isBubbleOpen, setIsBubbleOpen] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);

  const runStep = (direction: ProfileGuideStepDirection) =>
    setStep((current) => ({ key: current.key + 1, direction }));

  return (
    <main className="mx-auto flex max-w-browse flex-col gap-10 p-6">
      <h1 className="font-heading text-2xl font-bold text-ink">
        Vista de prueba: animaciones de la guía de perfil
      </h1>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-bold text-ink">
          1. Modal de bienvenida
        </h2>
        <div
          key={welcomeRun}
          className="grid overflow-hidden rounded-xl border border-border bg-surface md:grid-cols-2"
        >
          <ProfileGuideWelcomeHero className="bg-interaction" />
          <div className="flex flex-col justify-center gap-3 p-6">
            <ProfileGuideReveal delayMs={200}>
              <p className="font-heading text-2xl font-bold text-ink">
                Te damos la bienvenida
              </p>
            </ProfileGuideReveal>
            <ProfileGuideReveal delayMs={350}>
              <p className="text-text-secondary">
                Texto de ejemplo para la aparición escalonada.
              </p>
            </ProfileGuideReveal>
          </div>
        </div>
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setWelcomeRun((run) => run + 1)}
          >
            Repetir bienvenida
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-bold text-ink">
          2. Poses, transición de paso y celebración breve
        </h2>
        <div className="flex flex-wrap items-center gap-6 rounded-xl border border-border bg-surface p-6">
          <ProfileGuideMascot
            pose={pose}
            isTalking={isTalking}
            stepKey={step.key}
            stepDirection={step.direction}
            celebrationKey={celebrationKey}
          />
          <ProfileGuidePop
            isActive={isSectionDone}
            className={
              isSectionDone ? 'text-success' : 'text-text-secondary'
            }
          >
            <Check aria-hidden="true" className="size-8" />
          </ProfileGuidePop>
        </div>
        <div className="flex flex-wrap gap-2">
          {PREVIEW_POSES.map((option) => (
            <Button
              key={option.pose}
              type="button"
              variant={option.pose === pose ? 'default' : 'outline'}
              aria-pressed={option.pose === pose}
              onClick={() => setPose(option.pose)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => runStep('backward')}
          >
            Paso anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => runStep('forward')}
          >
            Paso siguiente
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setCelebrationKey((key) => key + 1)}
          >
            Celebración breve
          </Button>
          <Button
            type="button"
            variant="outline"
            aria-pressed={isTalking}
            onClick={() => setIsTalking((value) => !value)}
          >
            {isTalking ? 'Dejar de hablar' : 'Hablar'}
          </Button>
          <Button
            type="button"
            variant="outline"
            aria-pressed={isSectionDone}
            onClick={() => setIsSectionDone((value) => !value)}
          >
            {isSectionDone ? 'Desmarcar sección' : 'Completar sección'}
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-bold text-ink">
          3. Celebración al 100%
        </h2>
        <div
          key={celebrationRun}
          className="rounded-xl border border-border bg-surface p-6"
        >
          <CelebrationPreview />
        </div>
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setCelebrationRun((run) => run + 1)}
          >
            Repetir
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-bold text-ink">
          4. Widget con globo
        </h2>
        <div className="flex h-40 items-end justify-end gap-3 rounded-xl border border-border bg-surface p-6">
          <ProfileGuideBubble
            isOpen={isBubbleOpen}
            popKey={messageIndex}
            className="max-w-64"
          >
            {PREVIEW_MESSAGES[messageIndex]}
          </ProfileGuideBubble>
          <ProfileGuideMascot
            pose="wave"
            size="sm"
            className="transition-transform hover:scale-105"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsBubbleOpen((value) => !value)}
          >
            {isBubbleOpen ? 'Minimizar globo' : 'Restaurar globo'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setMessageIndex((index) => (index + 1) % PREVIEW_MESSAGES.length)
            }
          >
            Cambiar texto
          </Button>
        </div>
      </section>
    </main>
  );
}
