'use client';

import { useRouter } from 'next/navigation';
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
import { useUnsavedChangesGuard } from '@/shared/hooks/use-unsaved-changes-guard';
import type { PresentationLeaveDialogProps } from '../types/presentation-leave-dialog-props.types';

export function PresentationLeaveDialog({
  dirty,
  isSaving,
  returnFocus,
  onSave,
  onDiscard,
}: PresentationLeaveDialogProps) {
  const router = useRouter();
  const { pendingHref, pendingAction, clearPendingHref, clearPendingAction } =
    useUnsavedChangesGuard(dirty || isSaving);
  const navigate =
    pendingAction ?? (pendingHref ? () => router.push(pendingHref) : null);
  function clearNavigation() {
    clearPendingHref();
    clearPendingAction();
  }

  async function saveAndLeave() {
    if (isSaving || !navigate) return;
    const saved = await onSave();
    clearNavigation();
    if (saved) navigate();
  }

  return (
    <AlertDialog
      open={navigate !== null}
      onOpenChange={(open) => {
        if (!open && !isSaving) clearNavigation();
      }}
    >
      <AlertDialogContent
        finalFocus={returnFocus}
        className="data-[size=default]:sm:max-w-xl"
      >
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
              clearNavigation();
              navigate?.();
            }}
          >
            Descartar cambios
          </AlertDialogAction>
          <AlertDialogAction
            disabled={isSaving}
            onClick={saveAndLeave}
          >
            {isSaving ? 'Guardando…' : 'Guardar cambios'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
