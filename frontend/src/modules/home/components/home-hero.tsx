import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button-variants";
import { PUBLIC_CTA_CLASS } from "@/shared/constants/public-navigation.constants";
import { HomeHeroCarousel } from "./home-hero-carousel";
import { HOME_HERO } from "../constants/home.constants";

export function HomeHero() {
  return (
    <section className="bg-accent pt-10 text-surface md:pt-12">
      <HomeHeroCarousel />
      <div className="mx-auto max-w-[1440px] px-6 pt-10 pb-20 md:px-10 md:pb-24">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <p className="max-w-xl text-lg leading-relaxed text-surface/80 md:text-xl">{HOME_HERO.description}</p>
          <Link href={HOME_HERO.action.href} className={cn(buttonVariants({ size: "lg" }), PUBLIC_CTA_CLASS, "shrink-0 self-start bg-surface text-ink hover:bg-surface-soft md:self-auto")}>{HOME_HERO.action.label}<ArrowRight aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  );
}
