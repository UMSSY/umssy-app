"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { HOME_HERO, HOME_SLANT_TAG_CLASS } from "../constants/home.constants";

export function HomeHeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);  
  const [stopped, setStopped] = useState(false);
  const total = HOME_HERO.slides.length;

  useEffect(() => {
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (paused || stopped || reducedMotion || total < 2) return;
    const timer = window.setInterval(() => {
      setCurrent((index) => (index + 1) % total);
    }, HOME_HERO.autoplayMs);
    return () => window.clearInterval(timer);
  }, [paused, stopped, total]);

  const selectSlide = (index: number) => {
    setCurrent(index);
    setStopped(true);
  };

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="relative h-[460px] overflow-hidden bg-ink md:h-[600px]">
        {HOME_HERO.slides.map((slide, index) => {
          const isCurrent = index === current;
          return (
            <div key={slide.src} aria-hidden={!isCurrent} className={cn("absolute inset-0 transition-opacity duration-700 ease-in-out motion-reduce:transition-none", isCurrent ? "opacity-100" : "opacity-0")}>
              <Image src={slide.src} alt={isCurrent ? slide.alt : ""} fill priority={index === 0} sizes="100vw" style={{ objectPosition: slide.position }} className="object-cover" />
            </div>
          );
        })}

        <div className="pointer-events-none absolute bottom-0 left-0 z-10 max-w-[85%] pb-5 md:pb-7">
          <span className={HOME_SLANT_TAG_CLASS}>{HOME_HERO.tag}</span>
          <h1 className="mt-3 pl-4 font-tight text-3xl leading-[0.95] font-extrabold tracking-tight text-surface uppercase drop-shadow-[0_2px_14px_rgb(11_31_46/0.9)] sm:text-5xl md:pl-6 xl:text-6xl">
            {HOME_HERO.titleLines[0]}<br /><span className="text-surface/80">{HOME_HERO.titleLines[1]}</span>
          </h1>
        </div>

        {total > 1 && (
          <div className="absolute right-5 bottom-5 z-20 flex items-center gap-1 md:right-8 md:bottom-7">
            {HOME_HERO.slides.map((slide, index) => (
              <Button key={slide.src} variant="ghost" aria-label={`${HOME_HERO.slideLabel} ${index + 1}`} aria-current={index === current} onClick={() => selectSlide(index)} className="size-6 rounded-full p-0 hover:bg-transparent focus-visible:ring-surface">
                <span className={cn("block size-3 rounded-full transition-all duration-300", index === current ? "scale-110 bg-danger" : "bg-surface hover:bg-surface/70")} />
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
