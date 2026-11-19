"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  PUSH_GUIDE_CLOSE_LABEL,
  PUSH_GUIDES,
} from "@/shared/constants/push-permission.constants";
import type { PushGuideKind } from "@/shared/types/push-guide-kind.types";

interface PushGuideDialogProps {
  kind: PushGuideKind | null;
  onClose: () => void;
}

export function PushGuideDialog({ kind, onClose }: PushGuideDialogProps) {
  const guide = kind ? PUSH_GUIDES[kind] : null;

  return (
    <AlertDialog
      open={guide !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <AlertDialogContent>
        {guide ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>{guide.title}</AlertDialogTitle>
              <AlertDialogDescription>{guide.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-ink">
              {guide.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <AlertDialogFooter>
              <AlertDialogAction type="button" onClick={onClose}>
                {PUSH_GUIDE_CLOSE_LABEL}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}
