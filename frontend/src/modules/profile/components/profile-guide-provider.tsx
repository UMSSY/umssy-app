'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, ListChecks, X } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from '@/components/ui/progress';
import { useAuth } from '@/shared/contexts/auth-context';
import {
  PROFILE_COMPLETENESS_SECTION_IDS,
  PROFILE_COMPLETENESS_SECTION_LABELS,
} from '../constants/profile-completeness.constants';
import { ProfileGuideContext } from '../contexts/profile-guide-context';
import { useProfile } from '../hooks/use-profile';
import { useProfileCompleteness } from '../hooks/use-profile-completeness';
import {
  createProfileGuideSession,
  profileGuideStorage,
} from '../services/profile-guide-storage';
import type { ProfileGuideProviderProps } from '../types/profile-guide-provider-props.types';
import type { ProfileGuideSession } from '../types/profile-guide-session.types';
import type { ProfileCompletenessSectionId } from '../types/profile-completeness-section-id.types';
import type { ProfileGuideStepDirection } from '../types/profile-guide-step-direction.types';
import { getProfileGuideResumeStep } from '../utils/get-profile-guide-resume-step';
import { ProfileCompletenessProgress } from './profile-completeness-progress';
import { ProfileGuideBubble } from './profile-guide-bubble';
import { ProfileGuideCelebration } from './profile-guide-celebration';
import { ProfileGuideMascot } from './profile-guide-mascot';
import { ProfileGuideStepContent } from './profile-guide-step-content';
import { ProfileGuideWelcome } from './profile-guide-welcome';

export function ProfileGuideProvider({ children }: ProfileGuideProviderProps) {
  const { currentUserId, roles, isLoading } = useAuth();
  if (isLoading || !currentUserId || !roles.includes('titulado'))
    return children;
  return (
    <ProfileGuideSessionProvider key={currentUserId} userId={currentUserId}>
      {children}
    </ProfileGuideSessionProvider>
  );
}

function ProfileGuideSessionProvider({
  children,
  userId,
}: ProfileGuideProviderProps & { userId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useProfile();
  const { completeness, error, reload } = useProfileCompleteness(false);
  const [session, setSession] = useState<ProfileGuideSession | null>(null);
  const sessionRef = useRef<ProfileGuideSession>(createProfileGuideSession());
  const writesRef = useRef(Promise.resolve());
  const [storageError, setStorageError] = useState(false);
  const [mode, setMode] = useState<'idle' | 'wizard' | 'finish'>('idle');
  const [step, setStep] = useState<ProfileCompletenessSectionId>('contact');
  const [direction, setDirection] =
    useState<ProfileGuideStepDirection>('forward');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const dirtyRef = useRef(false);
  const busyRef = useRef(false);
  const [saved, setSaved] = useState(false);
  const [celebrationKey, setCelebrationKey] = useState(0);
  const [editorVersion, setEditorVersion] = useState(0);
  const [showPending, setShowPending] = useState(false);
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const enabled = Boolean(session && profile?.id === userId && completeness);
  const isComplete = completeness?.percentage === 100;
  const showWelcome =
    enabled &&
    mode === 'idle' &&
    pathname === '/dashboard' &&
    !isComplete &&
    !session?.dismissed;
  const isOpen = showWelcome || mode !== 'idle';
  const index = PROFILE_COMPLETENESS_SECTION_IDS.indexOf(step);
  const sectionComplete = Boolean(
    completeness?.sections.find((section) => section.id === step)?.isCompleted,
  );

  useEffect(() => {
    let active = true;
    void profileGuideStorage
      .read(userId)
      .catch(() => {
        if (active) setStorageError(true);
        return createProfileGuideSession();
      })
      .then((restored) => {
        if (!active) return;
        sessionRef.current = restored;
        setSession(restored);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (mode === 'wizard') headingRef.current?.focus();
  }, [mode, step, editorVersion]);

  function persist(patch: Partial<ProfileGuideSession>) {
    const next = { ...sessionRef.current, ...patch };
    sessionRef.current = next;
    setSession(next);
    // El orden de escritura evita restaurar un paso anterior al navegar rápido.
    writesRef.current = writesRef.current
      .then(() => profileGuideStorage.write(userId, next))
      .catch(() => {
        setStorageError(true);
      });
  }

  const onDirtyChange = useCallback((value: boolean) => {
    dirtyRef.current = value;
    setDirty(value);
    if (value) setSaved(false);
  }, []);
  const onBusyChange = useCallback((value: boolean) => {
    busyRef.current = value;
    setBusy(value);
  }, []);
  const onSaved = useCallback(() => {
    dirtyRef.current = false;
    setDirty(false);
    setSaved(true);
    setCelebrationKey((value) => value + 1);
    void reload();
  }, [reload]);

  function resetEditor() {
    onDirtyChange(false);
    onBusyChange(false);
    setSaved(false);
    setEditorVersion((value) => value + 1);
  }

  function guarded(action: () => void) {
    if (busyRef.current) return;
    if (dirtyRef.current) {
      pendingActionRef.current = action;
      setDiscardOpen(true);
    } else action();
  }

  function moveTo(next: ProfileCompletenessSectionId) {
    setDirection(
      PROFILE_COMPLETENESS_SECTION_IDS.indexOf(next) < index
        ? 'backward'
        : 'forward',
    );
    resetEditor();
    setStep(next);
    setShowPending(false);
    persist({ lastStep: next, dismissed: true });
  }

  function start(requested?: ProfileCompletenessSectionId) {
    if (!completeness || !session) return;
    guarded(() => {
      moveTo(requested ?? getProfileGuideResumeStep(completeness, session));
      setMode(isComplete && !requested ? 'finish' : 'wizard');
      setBubbleOpen(false);
    });
  }

  function pause() {
    guarded(() => {
      resetEditor();
      persist({ dismissed: true });
      setMode('idle');
      setBubbleOpen(false);
    });
  }

  function next() {
    if (busyRef.current || dirtyRef.current || !sectionComplete || error)
      return;
    if (isComplete) setMode('finish');
    else if (index < PROFILE_COMPLETENESS_SECTION_IDS.length - 1)
      moveTo(PROFILE_COMPLETENESS_SECTION_IDS[index + 1]);
    else setShowPending(true);
  }

  function skip() {
    guarded(() => {
      persist({ skipped: [...new Set([...sessionRef.current.skipped, step])] });
      if (index < PROFILE_COMPLETENESS_SECTION_IDS.length - 1)
        moveTo(PROFILE_COMPLETENESS_SECTION_IDS[index + 1]);
      else {
        resetEditor();
        setShowPending(true);
      }
    });
  }

  function finish() {
    persist({ dismissed: true, completed: true, lastStep: null, skipped: [] });
    resetEditor();
    setMode('idle');
    setBubbleOpen(false);
    router.push('/dashboard');
  }

  return (
    <ProfileGuideContext.Provider
      value={{ isEnabled: enabled, isComplete, start }}
    >
      {children}
      {enabled && !isOpen ? (
        <aside
          aria-label="Asistente de perfil UMSSY"
          className="fixed right-4 bottom-24 z-40 flex max-w-xs flex-col items-end gap-2 sm:right-6"
        >
          <ProfileGuideBubble isOpen={bubbleOpen} popKey={celebrationKey}>
            <div className="space-y-3">
              <p className="font-semibold text-ink">
                {isComplete
                  ? 'Tu perfil está completo'
                  : 'Sigamos con tu perfil'}
              </p>
              <p className="text-sm text-text-secondary">
                {isComplete
                  ? 'Puedes revisar tu trayectoria desde Mi perfil. Estoy aquí cuando me necesites.'
                  : 'Tus datos guardados están a salvo. Retomemos la siguiente sección pendiente.'}
              </p>
              {storageError ? (
                <p role="status" className="text-xs text-text-secondary">
                  No se pudo recordar esta guía en el navegador. Tus datos
                  guardados siguen en tu perfil.
                </p>
              ) : null}
              <Button
                size="sm"
                onClick={() => {
                  if (isComplete) {
                    setBubbleOpen(false);
                    router.push('/profile');
                  } else start();
                }}
              >
                {isComplete ? 'Revisar mi perfil' : 'Continuar mi perfil'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setBubbleOpen(false)}
              >
                Ocultar ayuda
              </Button>
            </div>
          </ProfileGuideBubble>
          <Button
            data-profile-guide-trigger
            variant="ghost"
            className="size-20 rounded-full bg-surface p-1 shadow-lg"
            aria-label="Abrir asistente de perfil"
            aria-expanded={bubbleOpen}
            onClick={() => setBubbleOpen((value) => !value)}
          >
            <ProfileGuideMascot size="sm" pose="wave" isFloating />
          </Button>
        </aside>
      ) : null}
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (mode === 'finish') finish();
            else pause();
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          finalFocus={() =>
            document.querySelector<HTMLElement>(
              '[data-profile-guide-trigger]',
            ) ?? true
          }
          className={cn(
            'max-h-editor-dialog gap-0 p-0 motion-reduce:animate-none sm:max-w-5xl motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none',
            mode === 'wizard' ? 'overflow-hidden' : 'overflow-y-auto',
          )}
        >
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Pausar guía"
            disabled={busy}
            onClick={mode === 'finish' ? finish : pause}
            className="absolute top-3 right-3 z-10"
          >
            <X aria-hidden="true" />
          </Button>
          {showWelcome ? (
            <ProfileGuideWelcome
              firstName={profile?.firstName || 'qué gusto verte'}
              onStart={() => start()}
              onLater={pause}
            />
          ) : mode === 'finish' ? (
            <div className="space-y-5 p-8 text-center">
              <ProfileGuideCelebration className="mx-auto" />
              <Progress
                value={completeness?.percentage ?? 100}
                className="mx-auto w-full max-w-sm gap-3 [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-indicator]]:bg-app-header [&_[data-slot=progress-indicator]]:motion-reduce:transition-none [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:bg-interaction"
              >
                <ProgressLabel className="sr-only">
                  Completitud del perfil
                </ProgressLabel>
                <ProgressValue className="mx-auto font-heading text-4xl font-bold text-app-header">
                  {() => `${completeness?.percentage ?? 100}%`}
                </ProgressValue>
              </Progress>
              <DialogTitle className="text-3xl font-bold text-ink">
                ¡Tu perfil está completo!
              </DialogTitle>
              <DialogDescription>
                Ya estás listo para conectar con las oportunidades de UMSSY.
                Puedes actualizar tu información cuando quieras.
              </DialogDescription>
              <Button onClick={finish}>Volver al inicio</Button>
            </div>
          ) : mode === 'wizard' ? (
            <div className="flex max-h-editor-dialog min-h-0 flex-col">
              <header className="shrink-0 space-y-3 border-b border-border px-5 pt-6 pr-14 pb-4 sm:px-7 sm:pr-14">
                <p className="text-xs font-semibold text-app-header">
                  TU PERFIL EN UMSSY · PASO {index + 1} DE{' '}
                  {PROFILE_COMPLETENESS_SECTION_IDS.length}
                </p>
                <DialogTitle
                  ref={headingRef}
                  tabIndex={-1}
                  className="text-2xl font-bold text-ink outline-none"
                >
                  {PROFILE_COMPLETENESS_SECTION_LABELS[step]}
                </DialogTitle>
                <DialogDescription>
                  Guarda tus cambios y pulsa Siguiente para continuar. Puedes
                  omitir esta sección y retomarla después.
                </DialogDescription>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_15rem]">
                  <div className="min-w-0 space-y-5">
                    <ProfileCompletenessProgress showChecklist={false} />
                    {storageError ? (
                      <p role="status" className="text-sm text-text-secondary">
                        No se pudo recordar el paso en este navegador. Tus datos
                        guardados siguen disponibles en tu perfil.
                      </p>
                    ) : null}
                    <div
                      key={`${step}-${editorVersion}`}
                      className="animate-in duration-300 fade-in slide-in-from-left-2 motion-reduce:animate-none"
                    >
                      <ProfileGuideStepContent
                        step={step}
                        onDirtyChange={onDirtyChange}
                        onBusyChange={onBusyChange}
                        onSaved={onSaved}
                      />
                    </div>
                  </div>
                  <aside className="order-first grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 rounded-xl bg-interaction p-4 text-center lg:sticky lg:top-0 lg:order-last lg:flex lg:flex-col lg:self-start">
                    <ProfileGuideMascot
                      pose="point"
                      size="md"
                      entrance="pop"
                      stepKey={step}
                      stepDirection={direction}
                      celebrationKey={celebrationKey}
                      isTalking={dirty}
                    />
                    <p
                      role="status"
                      aria-live="polite"
                      className="text-sm text-ink"
                    >
                      {busy
                        ? 'Estoy guardando tu información...'
                        : dirty
                          ? 'Cuando termines, guarda tus cambios para continuar.'
                          : error
                            ? 'Tus datos guardados se conservan. Reintenta consultar el progreso para continuar.'
                            : saved
                              ? sectionComplete
                                ? '¡Cambios guardados! Ya puedes continuar.'
                                : 'Cambios guardados. Aún falta información para completar esta sección. Puedes agregarla u omitirla.'
                              : sectionComplete
                                ? 'Esta sección ya está completa. Puedes revisarla o continuar.'
                                : 'Completemos esta sección juntos. Tú decides cuándo continuar.'}
                    </p>
                    <Button
                      variant="outline"
                      className="col-span-2"
                      disabled={busy}
                      aria-expanded={showPending}
                      onClick={() => setShowPending((value) => !value)}
                    >
                      <ListChecks aria-hidden="true" />
                      Ver pendientes
                    </Button>
                  </aside>
                </div>
                {showPending ? (
                  <section
                    aria-label="Pendientes de la guía"
                    className="grid gap-2 border-t border-border p-5 sm:grid-cols-2 sm:px-7"
                  >
                    {PROFILE_COMPLETENESS_SECTION_IDS.map((id) => {
                      const completed = completeness?.sections.find(
                        (section) => section.id === id,
                      )?.isCompleted;
                      return (
                        <Button
                          key={id}
                          variant="outline"
                          disabled={busy}
                          aria-current={id === step ? 'step' : undefined}
                          className="h-auto justify-start text-left whitespace-normal"
                          onClick={() => guarded(() => moveTo(id))}
                        >
                          {completed ? (
                            <Check aria-hidden="true" />
                          ) : (
                            <ArrowRight aria-hidden="true" />
                          )}
                          {PROFILE_COMPLETENESS_SECTION_LABELS[id]} ·{' '}
                          {completed ? 'Completada' : 'Pendiente'}
                        </Button>
                      );
                    })}
                  </section>
                ) : null}
              </div>
              <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-surface-soft p-5 sm:px-7">
                <Button
                  variant="outline"
                  disabled={busy || index === 0}
                  onClick={() =>
                    guarded(() =>
                      moveTo(PROFILE_COMPLETENESS_SECTION_IDS[index - 1]),
                    )
                  }
                >
                  <ArrowLeft aria-hidden="true" />
                  Anterior
                </Button>
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" disabled={busy} onClick={pause}>
                    Continuar más tarde
                  </Button>
                  {!sectionComplete ? (
                    <Button variant="outline" disabled={busy} onClick={skip}>
                      Omitir por ahora
                    </Button>
                  ) : null}
                  <Button
                    disabled={
                      busy || dirty || !sectionComplete || Boolean(error)
                    }
                    onClick={next}
                  >
                    {isComplete
                      ? 'Finalizar'
                      : index === PROFILE_COMPLETENESS_SECTION_IDS.length - 1
                        ? 'Revisar pendientes'
                        : 'Siguiente'}
                    <ArrowRight aria-hidden="true" />
                  </Button>
                </div>
              </footer>
            </div>
          ) : null}
          <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  ¿Descartar los cambios sin guardar?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  La información que ya guardaste se conservará. Los cambios
                  actuales de este formulario se perderán.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => {
                    pendingActionRef.current = null;
                  }}
                >
                  Seguir editando
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => {
                    const action = pendingActionRef.current;
                    pendingActionRef.current = null;
                    setDiscardOpen(false);
                    resetEditor();
                    action?.();
                  }}
                >
                  Descartar cambios
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogContent>
      </Dialog>
    </ProfileGuideContext.Provider>
  );
}
