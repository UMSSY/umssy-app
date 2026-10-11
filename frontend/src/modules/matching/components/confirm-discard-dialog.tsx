import { Button } from "@/components/ui/button";

interface ConfirmDiscardDialogProps {
  candidateName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Nota de arquitectura: el repo todavía no tiene un primitivo `Dialog`/`AlertDialog`
 * en `src/components/ui/`. Este componente resuelve la confirmación de forma inline
 * (sin overlay ni portal) para no bloquear la entrega. Cuando se agregue
 * `npx shadcn add alert-dialog`, este componente se puede reemplazar manteniendo
 * la misma interfaz (candidateName, onConfirm, onCancel).
 */
export function ConfirmDiscardDialog({
  candidateName,
  onConfirm,
  onCancel,
}: ConfirmDiscardDialogProps) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
      <p className="text-sm text-foreground">
        ¿Confirmas que deseas descartar a <span className="font-medium">{candidateName}</span>?
        Esta acción solo afecta tu vista actual.
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" variant="destructive" size="sm" onClick={onConfirm}>
          Sí, descartar
        </Button>
      </div>
    </div>
  );
}
