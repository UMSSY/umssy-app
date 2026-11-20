import type { ActivationNoticeProps } from "../../types/activation-notice-props.types";
import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "cn";

export function ActivationNotice({ title, message, actionLabel, onAction, disabled }: ActivationNoticeProps) {
  return (
    <div className="w-full max-w-md">
      <Alert className="border-border-strong bg-surface">
        <CircleAlert aria-hidden="true" />
        <AlertTitle className="font-semibold text-ink">{title}</AlertTitle>
        <AlertDescription className="text-text-secondary">{message}</AlertDescription>
      </Alert>
      <div className="mt-5 flex flex-wrap gap-3">
        {actionLabel && onAction ? (
          <Button type="button" variant="institutional" onClick={onAction} disabled={disabled} className="h-11 px-5 font-semibold">
            {actionLabel}
          </Button>
        ) : null}
        <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "h-11 px-5 font-semibold")}>
          Ir a iniciar sesión
        </Link>
      </div>
    </div>
  );
}
