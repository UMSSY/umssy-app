'use client';

import { BriefcaseBusiness, Check, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { ProfileGuideWelcomeProps } from '../types/profile-guide-welcome-props.types';
import { ProfileGuideWelcomeHero } from './profile-guide-welcome-hero';

export function ProfileGuideWelcome({
  firstName,
  onStart,
  onLater,
}: ProfileGuideWelcomeProps) {
  return (
    <div className="grid items-center gap-6 p-6 sm:p-10 md:grid-cols-2">
      <div className="flex justify-center rounded-2xl bg-interaction p-4">
        <ProfileGuideWelcomeHero />
      </div>
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-app-header">
            Guía de perfil
          </p>
          <DialogTitle className="font-heading text-3xl font-bold text-ink">
            ¡Hola, {firstName}!
          </DialogTitle>
          <h2 className="text-xl font-semibold text-app-header">
            ¡Bienvenido a UMSSY!
          </h2>
          <DialogDescription className="text-base leading-relaxed text-text-secondary">
            Soy tu asistente virtual y estoy aquí para ayudarte a completar tu
            perfil profesional. Te acompañaré paso a paso para que aproveches
            todas las oportunidades de nuestra comunidad.
          </DialogDescription>
        </div>
        <ul className="space-y-3 text-sm text-ink">
          <li className="flex items-center gap-3">
            <Check className="size-5 text-accent" aria-hidden="true" />
            Completa tu perfil.
          </li>
          <li className="flex items-center gap-3">
            <GraduationCap className="size-5 text-accent" aria-hidden="true" />
            Destaca tu trayectoria.
          </li>
          <li className="flex items-center gap-3">
            <BriefcaseBusiness
              className="size-5 text-accent"
              aria-hidden="true"
            />
            Conecta con oportunidades.
          </li>
        </ul>
        <div className="flex flex-wrap gap-3">
          <Button onClick={onStart}>Empezar ahora</Button>
          <Button variant="outline" onClick={onLater}>
            Más tarde
          </Button>
        </div>
        <p className="text-xs text-text-secondary">
          Puedes pausar y retomar cuando quieras desde Mi perfil.
        </p>
      </div>
    </div>
  );
}
