import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";

interface MentorProfileNavigationProps {
  mentorName: string;
}

export function MentorProfileNavigation({
  mentorName,
}: MentorProfileNavigationProps) {
  return (
    <div className="mb-6">
      <Link
        href="/mentorship/mentors"
        className="mb-4 inline-flex items-center gap-2 rounded-lg border border-umssy-border bg-white px-4 py-2 text-sm font-semibold text-umssy-ink shadow-sm transition hover:bg-umssy-background hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-umssy-red"
      >
        <ArrowLeft size={16} />
        Volver al directorio
      </Link>

      <nav
        aria-label="Ruta de navegación"
        className="flex flex-wrap items-center gap-1 text-sm"
      >
        <span className="text-umssy-secondary">UMSSY</span>

        <ChevronRight size={16} className="text-umssy-secondary" />

        <span className="text-umssy-secondary">Mentorías</span>

        <ChevronRight size={16} className="text-umssy-secondary" />

        <span className="text-umssy-secondary">Directorio de mentores</span>

        <ChevronRight size={16} className="text-umssy-secondary" />

        <span className="font-semibold text-umssy-ink">{mentorName}</span>
      </nav>
    </div>
  );
}
