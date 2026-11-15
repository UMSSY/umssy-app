'use client';

import { useEffect, useId, useRef, useState } from 'react';

export function useProfileCompletenessDisclosure(canCollapse: boolean) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isOpen = !canCollapse || isExpanded;
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!canCollapse || !isExpanded) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setIsExpanded(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setIsExpanded(false);
      triggerRef.current?.focus();
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [canCollapse, isExpanded]);

  return {
    isOpen,
    panelId,
    containerRef,
    triggerRef,
    toggle: () => {
      if (canCollapse) setIsExpanded((current) => !current);
    },
  };
}
