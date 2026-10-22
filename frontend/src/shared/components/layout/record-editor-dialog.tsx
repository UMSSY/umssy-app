"use client";

import { useRef, useState } from "react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { RecordEditorDialogProps } from "@/shared/types/record-editor-dialog-props.types";

export function RecordEditorDialog({ title, description, isBusy = false, hasUnsavedChanges = false, onClose, children }: RecordEditorDialogProps) {
  const [hasChanges, setHasChanges] = useState(false);
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  function requestClose() {
    if (isBusy) return;
    if (hasChanges || hasUnsavedChanges) setIsDiscardOpen(true);
    else onClose();
  }

  return (
    <Dialog open onOpenChange={(isOpen) => { if (!isOpen) requestClose(); }}>
      <DialogContent ref={dialogRef} initialFocus={() => dialogRef.current?.querySelector<HTMLElement>('input:not([type="hidden"]):not([type="file"]):not([disabled]), textarea:not([disabled]), [role="combobox"]:not([aria-disabled="true"])') ?? true} showCloseButton={false} aria-busy={isBusy} className="max-h-editor-dialog overflow-y-auto p-6 sm:max-w-3xl" onChangeCapture={() => setHasChanges(true)}>
        <DialogClose render={<Button variant="ghost" size="icon-sm" className="absolute top-3 right-3" disabled={isBusy} aria-label="Cerrar formulario" />}><X aria-hidden="true" /></DialogClose>
        <DialogHeader className="border-b border-border pr-8 pb-4">
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children(requestClose)}
        <AlertDialog open={isDiscardOpen} onOpenChange={setIsDiscardOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Descartar los cambios?</AlertDialogTitle>
              <AlertDialogDescription>Los cambios de este formulario todavía no se guardaron.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Seguir editando</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={onClose}>Descartar cambios</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
