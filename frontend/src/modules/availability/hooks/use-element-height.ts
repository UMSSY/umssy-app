"use client";

import { useEffect, useRef, useState } from "react";

export function useElementHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setHeight(node.getBoundingClientRect().height));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, height };
}
