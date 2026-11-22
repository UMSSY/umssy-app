'use client';

import { useLayoutEffect, useState } from 'react';
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
import { useProfileGuide } from '../contexts/profile-guide-context';
import type { PresentationLeaveDialogProps } from '../types/presentation-leave-dialog-props.types';

export function PresentationLeaveDialog({
  dirty,
  isSaving,
  returnFocus,
  onSave,
  onDiscard,
}: PresentationLeaveDialogProps) {
  const registerGuard = useProfileGuide()?.registerReviewGuard;
  const [navigate, setNavigate] = useState<(() => void) | null>(null);

  useLayoutEffect(() => {
    if (!dirty && !isSaving) return;
    return registerGuard?.((proceed) => {
      if (!isSaving) setNavigate(() => proceed);
    });
  }, [dirty, isSaving, registerGuard]);

  async function saveAndLeave() {
    if (isSaving || !navigate) return;
    const saved = await onSave();
    setNavigate(null);
    if (saved) navigate();
  }

  return (
    <AlertDialog
      open={navigate !== null}
      onOpenChange={(open) => {
        if (!open && !isSaving) setNavigate(null);
      }}
    >
      <AlertDialogContent finalFocus={returnFocus} className="data-[size=default]:sm:max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>¿Deseas salir de esta sección?</AlertDialogTitle>
          <AlertDialogDescription>
            Tienes cambios sin guardar en tu presentación profesional. Elige qué
            hacer antes de ir a Mi perfil.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSaving}>
            Continuar editando
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isSaving}
            onClick={() => {
              onDiscard();
              setNavigate(null);
              navigate?.();
            }}
          >
            Descartar cambios
          </AlertDialogAction>
          <AlertDialogAction variant="brand" disabled={isSaving} onClick={saveAndLeave}>
            {isSaving ? 'Guardando…' : 'Guardar cambios'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
