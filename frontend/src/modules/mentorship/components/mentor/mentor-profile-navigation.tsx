import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

interface MentorProfileNavigationProps {
  mentorName: string;
  returnTo?: string;
}

function getSafeReturnTo(returnTo?: string): string {
  const fallback = "/mentorship/mentors";

  if (
    !returnTo ||
    !returnTo.startsWith("/mentorship/mentors") ||
    returnTo.startsWith("//") ||
    returnTo.includes("\\") ||
    returnTo.includes("://")
  ) {
    return fallback;
  }

  const [pathname, query = ""] = returnTo.split("?");

  if (pathname !== fallback) {
    return fallback;
  }

  return query ? `${pathname}?${query}` : pathname;
}

export function MentorProfileNavigation({
  mentorName,
  returnTo = "/mentorship/mentors",
}: MentorProfileNavigationProps) {
  const safeReturnTo = getSafeReturnTo(returnTo);

  return (
    <nav
      aria-label={`Navegación del perfil de ${mentorName}`}
      className="mb-5"
    >
      <Link
        href={safeReturnTo}
        className={buttonVariants({
          variant: "ghost",
          className:
            "gap-2 px-0 text-text-secondary hover:bg-transparent hover:text-accent",
        })}
      >
        <ArrowLeft aria-hidden="true" />
        Volver al directorio
      </Link>
    </nav>
  );
}