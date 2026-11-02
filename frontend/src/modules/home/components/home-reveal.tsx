"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "cn";

type HomeRevealProps = {
  children: ReactNode;
  className?: string;
};
export function HomeReveal({ children, className }: HomeRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

    useEffect(() => {
    const element = ref.current;
    if (!element) return;
       if (typeof IntersectionObserver === "undefined") {
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "will-change-[translate,opacity] [transition:opacity_500ms_ease-out,translate_1000ms_cubic-bezier(0.22,1,0.36,1)] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
