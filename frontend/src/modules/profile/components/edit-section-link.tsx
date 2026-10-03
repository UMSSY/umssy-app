import { Pencil } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SECONDARY_BUTTON_CLASS } from "../config/form-styles.config";
import type { EditSectionLinkProps } from "../types/edit-section-link-props.types";

export function EditSectionLink({ href, sectionName }: EditSectionLinkProps) {
  return (
    <Link
      href={href}
      aria-label={`Editar ${sectionName}`}
      className={cn(buttonVariants({ variant: "outline" }), SECONDARY_BUTTON_CLASS, "h-10 px-4")}
    >
      <Pencil aria-hidden="true" />
      Editar
    </Link>
  );
}
