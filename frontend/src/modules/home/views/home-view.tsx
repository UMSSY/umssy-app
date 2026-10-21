import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BriefcaseBusiness, CalendarDays, Users } from "lucide-react";
import { PublicHeader, PublicFooter } from "@/shared/components/layout";
import { buttonVariants } from "@/components/ui/button";
import { PublicEventsSection } from "@/modules/events";

export function HomeView() {
  return <div className="bg-surface text-ink"><PublicHeader /><main>
    <section className="mx-auto grid max-w-[1440px] items-center gap-12 px-8 py-16 lg:grid-cols-2">
      <div><h1 className="max-w-xl font-tight text-5xl leading-[1.08] font-extrabold tracking-tight lg:text-6xl">Tu comunidad.<br />Tu próximo paso.</h1><p className="my-7 max-w-md text-lg leading-relaxed text-text-secondary">Conecta con mentores, participa en talleres y encuentra oportunidades profesionales.</p><div className="flex flex-wrap gap-3"><Link href="/workshops" className={buttonVariants({size:"lg"})}>Explorar talleres<ArrowRight aria-hidden="true" /></Link><Link href="/request-access" className={buttonVariants({variant:"outline",size:"lg"})}>Unirme a la comunidad</Link></div></div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg"><Image src="/images/scesi-umss.webp" alt="Estudiantes en el stand de la SCESI UMSS" fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" /></div>
    </section>
    <section id="community" className="scroll-mt-28 border-y border-border bg-surface-soft"><div className="mx-auto grid max-w-[1440px] gap-10 px-8 py-10 md:grid-cols-3"><div className="flex gap-4"><Users className="size-7 shrink-0 text-accent" aria-hidden="true" /><div><h2 className="text-lg font-bold">Encuentra orientación</h2><p className="mt-2 text-sm text-text-secondary">Aprende de la experiencia de otros profesionales.</p></div></div><div className="flex gap-4"><CalendarDays className="size-7 shrink-0 text-accent" aria-hidden="true" /><div><h2 className="text-lg font-bold">Sigue aprendiendo</h2><p className="mt-2 text-sm text-text-secondary">Descubre talleres y actividades de la comunidad.</p></div></div><div className="flex gap-4"><BriefcaseBusiness className="size-7 shrink-0 text-accent" aria-hidden="true" /><div><h2 className="text-lg font-bold">Explora oportunidades</h2><p className="mt-2 text-sm text-text-secondary">Acerca tu perfil a nuevas opciones laborales.</p></div></div></div></section>
    <section className="mx-auto max-w-[1440px] px-8 py-14"><div className="mb-7 flex items-center justify-between gap-4"><h2 className="font-tight text-3xl font-bold">Talleres de la comunidad</h2><Link href="/workshops" className="flex items-center gap-2 text-sm font-semibold text-accent">Ver todos los talleres<ArrowRight className="size-4" aria-hidden="true" /></Link></div><PublicEventsSection /></section>
    <section id="how-it-works" className="scroll-mt-28 bg-interaction"><div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-8 py-12"><div><h2 className="font-tight text-3xl font-bold">Haz espacio para lo que viene.</h2><p className="mt-3 max-w-xl text-text-secondary">Solicita acceso. Una vez aprobada tu cuenta, completa tu perfil y explora la comunidad.</p></div><Link href="/request-access" className={buttonVariants({size:"lg",className:"shrink-0"})}>Solicitar acceso<ArrowRight aria-hidden="true" /></Link></div></section>
  </main><PublicFooter /></div>;
}
