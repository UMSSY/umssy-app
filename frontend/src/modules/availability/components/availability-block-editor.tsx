"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RecordEditorDialog } from "@/shared/components/layout/record-editor-dialog";
import { DangerZone } from "@/shared/components/layout/danger-zone";
import { useCreateAvailabilityBlock } from "../hooks/use-create-availability-block";
import { useUpdateAvailabilityBlock } from "../hooks/use-update-availability-block";
import type { AvailabilityBlockEditorProps } from "../types/availability-block-editor-props.types";
import type { CreateAvailabilityBlockInput } from "../types/create-availability-block-input.types";
import { EDIT_BLOCK_HINT } from "../constants/availability.constants";
import { BlockForm } from "./block-form";
import { DeleteBlockDialog } from "./delete-block-dialog";

export function AvailabilityBlockEditor({ block, onClose, onCreated }: AvailabilityBlockEditorProps) {
  const create = useCreateAvailabilityBlock();
  const update = useUpdateAvailabilityBlock();
  const [hasChanges, setHasChanges] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const isBusy = create.isSubmitting || update.isSubmitting;
  const isEditable = !block || block.state === "free";

  async function handleSubmit(values: CreateAvailabilityBlockInput) {
    if (isBusy || !isEditable) return;
    const saved = block ? await update.updateBlock(block.id, values) : await create.createBlock(values);
    if (!saved) return;
    if (!block) onCreated(saved);
    onClose();
  }

  return (
    <RecordEditorDialog title={block ? "Editar bloque de disponibilidad" : "Añadir bloque de disponibilidad"} description="Define la fecha y el horario en los que puedes brindar una mentoría." isBusy={isBusy} hasUnsavedChanges={hasChanges} onClose={onClose}>
      {(requestClose) => <>
        <BlockForm mode={block ? "edit" : "create"} initialValues={block ? { startAt: block.startAt, endAt: block.endAt } : undefined} disabled={!isEditable} isSubmitting={isBusy} onValuesChange={() => setHasChanges(true)} onSubmit={(values) => void handleSubmit(values)} onCancel={requestClose} />
        {block ? <>
          <DangerZone title="Eliminar bloque" description="Este horario dejará de estar disponible para solicitar una mentoría.">
            {!isEditable ? <p className="text-sm text-ink-soft">{EDIT_BLOCK_HINT}</p> : null}
            <Button variant="destructive" disabled={!isEditable || isBusy} onClick={() => setIsDeleteOpen(true)}>Eliminar bloque</Button>
          </DangerZone>
          <DeleteBlockDialog block={block} open={isDeleteOpen} onOpenChange={setIsDeleteOpen} onDeleted={onClose} />
        </> : null}
      </>}
    </RecordEditorDialog>
  );
}
