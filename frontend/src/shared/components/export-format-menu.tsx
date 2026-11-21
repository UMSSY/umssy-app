"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EXPORT_FORMAT_OPTIONS } from "@/shared/constants/export-format.constants";
import type { ExportFormatMenuProps } from "@/shared/types/export-format-menu-props.types";

export function ExportFormatMenu({
  triggerLabel,
  formatTexts,
  onSelectFormat,
  formatHeading,
  cancelLabel,
  triggerVariant = "brand",
  disabled = false,
  isLoading = false,
  contentClassName,
  children,
}: ExportFormatMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button type="button" variant={triggerVariant} className="group" disabled={disabled || isLoading} aria-busy={isLoading} />}
      >
        {triggerLabel}
        <ChevronDown className="size-4 transition-transform group-aria-expanded:rotate-180" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={cn("w-64 rounded-md shadow-lg", contentClassName)}>
        {children}
        {children ? <DropdownMenuSeparator /> : null}
        {formatHeading ? <p className="px-2 py-1 text-xs font-medium text-muted-foreground">{formatHeading}</p> : null}
        {EXPORT_FORMAT_OPTIONS.map(({ format, icon: Icon }) => (
          <DropdownMenuItem key={format} onClick={() => onSelectFormat(format)} className="items-start gap-3 p-3 whitespace-normal">
            <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <span className="flex flex-col gap-1">
              <span className="font-medium">{formatTexts[format]?.label}</span>
              <span className="text-xs font-normal text-muted-foreground">{formatTexts[format]?.description}</span>
            </span>
          </DropdownMenuItem>
        ))}
        {cancelLabel ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center p-2 text-sm text-muted-foreground">{cancelLabel}</DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
