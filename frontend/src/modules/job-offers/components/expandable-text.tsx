"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExpandableTextProps } from "../types/expandable-text-props.types";

export function ExpandableText({ text, maxChars, className }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const content = text.trim();
  const canExpand = content.length > maxChars;
  const visibleText =
    isExpanded || !canExpand ? content : `${content.slice(0, maxChars).trimEnd()}...`;

  return (
    <p className={cn("break-words", className)}>
      {visibleText}
      {canExpand ? (
        <>
          {" "}
          <Button
            type="button"
            variant="link"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((current) => !current)}
            className="h-auto p-0 font-semibold text-accent"
          >
            {isExpanded ? "Ver menos" : "Ver más"}
          </Button>
        </>
      ) : null}
    </p>
  );
}
