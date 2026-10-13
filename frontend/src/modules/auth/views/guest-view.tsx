"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BriefcaseBusiness, CalendarDays, GraduationCap, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

const SECTIONS = [
  {
    id: "vacancies", label: "Oportunidades", icon: BriefcaseBusiness,
    title: "Descubre tu próxima oportunidad",
    description: "Encuentra vacantes y descubre cómo tus habilidades se relacionan con sus requisitos.",
    items: [
      { title: "Desarrollo web junior", tag: "Tecnología", summary: "Una oportunidad de ejemplo para comenzar en desarrollo de aplicaciones.", detail: "Explora requisitos como JavaScript, trabajo en equipo y conocimientos de bases de datos. Con tu cuenta podrás completar tu perfil y consultar oportunidades disponibles.", action: "Crear cuenta para explorar vacantes" },
      { title: "Prácticas en gestión de proyectos", tag: "Prácticas", summary: "Conoce cómo encontrar experiencias para dar tus primeros pasos profesionales.", detail: "Un perfil con tu formación y habilidades ayuda a identificar oportunidades relacionadas con tus intereses. Aquí se muestra cómo se presenta una oportunidad.", action: "Crear mi perfil" },
    ],
  },
  {
    id: "mentors", label: "Mentorías", icon: GraduationCap,
    title: "Aprende con acompañamiento",
    description: "Conoce la orientación profesional y las mentorías de la comunidad.",
    items: [
      { title: "Prepara tu primera entrevista", tag: "Orientación laboral", summary: "Descubre cómo una mentoría puede ayudarte a prepararte para tu búsqueda laboral.", detail: "En la comunidad puedes explorar mentores, sus áreas de orientación y su disponibilidad. Una cuenta te permite acceder a las funciones de mentoría según tu rol.", action: "Unirme a la comunidad" },
      { title: "Traza tu camino en tecnología", tag: "Desarrollo profesional", summary: "Una sesión de ejemplo para conocer distintas rutas de aprendizaje.", detail: "Explora áreas técnicas y encuentra acompañamiento relacionado con tus objetivos. Esta sesión es una demostración, no una reserva disponible.", action: "Crear cuenta para conocer mentorías" },
    ],
  },
  {
    id: "events", label: "Eventos", icon: CalendarDays,
    title: "Conecta y sigue aprendiendo",
    description: "Descubre talleres, actividades y la experiencia de los pases digitales.",
    items: [
      { title: "Taller de currículum y portafolio", tag: "Taller", summary: "Una actividad de ejemplo para mostrar cómo explorar eventos de la comunidad.", detail: "Al unirte podrás consultar eventos publicados, sus horarios y los detalles de inscripción. Los eventos de esta vista son ejemplos y no tienen fechas ni cupos reales.", action: "Crear cuenta para ver eventos" },
      { title: "Encuentro de estudiantes y titulados", tag: "Comunidad", summary: "Imagina un espacio para compartir experiencias y conocer nuevos caminos profesionales.", detail: "La plataforma reúne oportunidades de aprendizaje y encuentro. En los eventos disponibles podrás revisar información y gestionar tus pases cuando corresponda.", action: "Quiero unirme" },
    ],
  },
  {
    id: "profile", label: "Mi perfil", icon: UserRound,
    title: "Dale visibilidad a tu trayectoria",
    description: "Reúne tu formación, experiencia y habilidades en un mismo lugar.",
    items: [
      { title: "Formación y experiencia", tag: "Perfil profesional", summary: "Organiza tus estudios, certificaciones y experiencias laborales.", detail: "Con tu cuenta puedes construir un perfil que refleje tu trayectoria. No necesitas tener experiencia laboral para comenzar: también puedes registrar tu formación y habilidades.", action: "Crear mi perfil" },
      { title: "Habilidades e intereses", tag: "Tu futuro", summary: "Explora cómo presentar tus habilidades y conocer requisitos de oportunidades.", detail: "Un perfil completo facilita explorar las funciones de la plataforma. Esta vista de invitado no guarda datos personales ni realiza postulaciones.", action: "Crear cuenta" },
    ],
  },
] as const;

export function GuestView() {
  const [activeSection, setActiveSection] = useState<string>("vacancies");
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const section = SECTIONS.find((item) => item.id === activeSection) ?? SECTIONS[0];

  return (
    <main className="min-h-screen bg-surface-soft text-ink">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link href="/guest" className="flex items-center gap-3">
            <Image src="/umss-logo.svg" alt="Escudo de la Universidad Mayor de San Simón" width={32} height={48} unoptimized />
            <span className="font-tight text-2xl font-extrabold">UMSSY</span>
          </Link>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <Link href="/login" className="hover:underline">Iniciar sesión</Link>
            <Link href="/register" className="rounded-lg bg-ink px-4 py-2 text-surface hover:bg-ink/90">Crear cuenta</Link>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
        <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-sm font-semibold">Vista de invitado</span>
        <h1 className="mt-5 font-tight text-3xl font-extrabold sm:text-4xl">Tu próximo paso comienza aquí</h1>
        <p className="mt-3 max-w-2xl text-text-secondary">Descubre cómo UMSSY conecta formación, oportunidades y comunidad. Explora los ejemplos y, cuando quieras participar, crea tu cuenta.</p>
        <p className="mt-2 text-sm text-text-secondary">Los contenidos de esta visita son demostrativos.</p>
        <nav aria-label="Explorar UMSSY" className="mt-8 flex flex-wrap gap-2">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <Button key={id} type="button" aria-pressed={activeSection === id} onClick={() => { setActiveSection(id); setSelectedItem(null); }} className={activeSection === id ? "bg-ink text-surface hover:bg-ink/90" : "border border-border bg-surface text-ink hover:bg-surface-soft"}>
              <Icon aria-hidden="true" className="size-4" />{label}
            </Button>
          ))}
        </nav>
        <section aria-label={section.label} className="mt-8">
          <h2 className="font-tight text-2xl font-extrabold">{section.title}</h2>
          <p className="mt-2 text-text-secondary">{section.description}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {section.items.map((item, index) => (
              <article key={item.title} className="rounded-xl border border-border bg-surface p-6 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{item.tag}</span>
                <h3 className="mt-2 text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{item.summary}</p>
                <Button type="button" variant="outline" aria-expanded={selectedItem === index} aria-controls={`guest-detail-${index}`} onClick={() => setSelectedItem(selectedItem === index ? null : index)} className="mt-4">{selectedItem === index ? "Cerrar detalles" : "Ver ejemplo"}</Button>
                {selectedItem === index ? (
                  <div id={`guest-detail-${index}`} className="mt-4 border-t border-border pt-4">
                    <p className="text-sm leading-6 text-text-secondary">{item.detail}</p>
                    <Link href="/register" className="mt-3 inline-block font-semibold text-ink underline underline-offset-4">{item.action}</Link>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
        <aside className="mt-8 rounded-xl bg-ink p-6 text-surface sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div><h2 className="font-tight text-xl font-bold">¿Te gustaría ser parte?</h2><p className="mt-2 text-sm text-surface/80">Crea tu cuenta como estudiante o titulado y comienza a construir tu perfil.</p></div>
          <Link href="/register" className="mt-4 inline-block shrink-0 rounded-lg bg-surface px-5 py-3 font-semibold text-ink sm:mt-0">Unirme a UMSSY</Link>
        </aside>
      </div>
    </main>
  );
}
