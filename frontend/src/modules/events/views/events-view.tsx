'use client';

import { Calendar, Clock, Info, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';

// Datos temporales basados en el mockup oficial para previsualizar el layout ante QA
const MOCKUP_PREVIEW_EVENTS = [
  {
    id: '1',
    category: 'Tecnologia',
    categoryStyle: 'bg-slate-200/80 text-ink',
    title: 'Desarrollo Web con React',
    dateText: 'jueves, 15 de octubre',
    timeText: '09:00 - 13:00',
    enrolled: 24,
    capacity: 30,
    isFull: false,
  },
  {
    id: '2',
    category: 'IA & Datos',
    categoryStyle: 'bg-amber-100/80 text-amber-800',
    title: 'Inteligencia Artificial Aplicada',
    dateText: 'domingo, 18 de octubre',
    timeText: '14:00 - 18:00',
    enrolled: 12,
    capacity: 50,
    isFull: false,
  },
  {
    id: '3',
    category: 'Diseno',
    categoryStyle: 'bg-slate-200/80 text-ink',
    title: 'Diseno UI/UX para Moviles',
    dateText: 'jueves, 22 de octubre',
    timeText: '08:30 - 12:30',
    enrolled: 20,
    capacity: 20,
    isFull: true,
  },
  {
    id: '4',
    category: 'Seguridad',
    categoryStyle: 'bg-interaction text-danger',
    title: 'Seguridad Informatica Basica',
    dateText: 'miercoles, 28 de octubre',
    timeText: '15:00 - 19:00',
    enrolled: 5,
    capacity: 25,
    isFull: false,
  },
  {
    id: '5',
    category: 'Tecnologia',
    categoryStyle: 'bg-slate-200/80 text-ink',
    title: 'Bases de Datos NoSQL',
    dateText: 'jueves, 5 de noviembre',
    timeText: '10:00 - 14:00',
    enrolled: 15,
    capacity: 20,
    isFull: false,
  },
  {
    id: '6',
    category: 'IA & Datos',
    categoryStyle: 'bg-amber-100/80 text-amber-800',
    title: 'Data Science con Python',
    dateText: 'jueves, 12 de noviembre',
    timeText: '08:00 - 12:00',
    enrolled: 35,
    capacity: 60,
    isFull: false,
  },
];

const MOCKUP_CATEGORIES = ['Todos', 'Tecnologia', 'IA & Datos', 'Diseno', 'Seguridad'];

export function EventsView() {
  return (
    <div className="min-h-screen bg-surface-soft text-foreground flex flex-col lg:flex-row">
      {/* Columna central: Catalogo de talleres disponibles */}
      <div className="flex-1 px-6 sm:px-10 py-8 flex flex-col gap-6 min-w-0">
        {/* Cabecera identica al mockup */}
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Talleres disponibles
          </h1>
          <p className="text-sm text-text-secondary">
            {MOCKUP_PREVIEW_EVENTS.length} talleres · Gestion 2025
          </p>
        </header>

        {/* Barra horizontal combinada: Buscador por texto + Chips de categorias */}
        <div
          role="search"
          aria-label="Filtros de talleres"
          className="flex flex-wrap items-center gap-2.5"
        >
          {/* Espacio para el componente Buscador (Miembro 2) */}
          <div className="w-full sm:w-64 h-10 rounded-full bg-surface border border-border px-4 flex items-center gap-2.5 shadow-2xs">
            <Search className="w-4 h-4 text-text-secondary shrink-0" aria-hidden="true" />
            <span className="text-sm text-text-secondary truncate">
              Buscar taller...
            </span>
          </div>

          {/* Espacio para el componente de Chips de categorias */}
          <div className="flex flex-wrap items-center gap-2">
            {MOCKUP_CATEGORIES.map((categoryName, index) => {
              const isSelected = index === 0;
              return (
                <span
                  key={categoryName}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-ink text-white'
                      : 'bg-surface text-ink border border-border'
                  }`}
                >
                  {categoryName}
                </span>
              );
            })}
          </div>
        </div>

        {/* Grilla de 2 columnas segun el mockup */}
        <section aria-label="Listado de talleres">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {MOCKUP_PREVIEW_EVENTS.map((workshop) => {
              const progressPercentage = Math.min(
                Math.round((workshop.enrolled / workshop.capacity) * 100),
                100,
              );

              return (
                <Card
                  key={workshop.id}
                  className="bg-surface border border-border rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-2xs hover:border-border-strong transition-colors cursor-pointer"
                >
                  {/* Fila superior: Categoria y etiqueta Lleno condicional */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${workshop.categoryStyle}`}
                    >
                      {workshop.category}
                    </span>

                    {workshop.isFull && (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-interaction text-danger">
                        Lleno
                      </span>
                    )}
                  </div>

                  {/* Cuerpo: Titulo y metadatos de fecha y hora */}
                  <div className="flex flex-col gap-2.5">
                    <h2 className="text-base font-bold text-ink leading-snug">
                      {workshop.title}
                    </h2>

                    <div className="flex flex-col gap-1.5 text-xs text-text-secondary">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>{workshop.dateText}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>{workshop.timeText}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pie: Barra de progreso dorada/roja alineada con el contador */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex-1 bg-slate-200/80 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          workshop.isFull ? 'bg-accent' : 'bg-gold'
                        }`}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-text-secondary shrink-0">
                      {workshop.enrolled}/{workshop.capacity}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </div>

      {/* Columna derecha del mockup: Panel de detalle ("Selecciona un taller") */}
      <aside
        aria-label="Detalle del taller seleccionado"
        className="w-full lg:w-80 xl:w-96 bg-surface border-t lg:border-t-0 lg:border-l border-border p-8 flex flex-col items-center justify-center text-center shrink-0"
      >
        <div className="max-w-xs flex flex-col items-center gap-3">
          <h2 className="text-lg font-bold text-ink">
            Selecciona un taller
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Elige un taller de la lista para ver su informacion y opciones de inscripcion
          </p>
          <div className="mt-2 w-12 h-12 rounded-2xl bg-surface-soft border border-border flex items-center justify-center text-text-secondary">
            <Info className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>
      </aside>
    </div>
  );
}