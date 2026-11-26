import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { APPLICATION_MESSAGES, getApplicationVacancyPath } from "../constants/application.constants";
import type { ViewVacancyLinkProps } from "../types/view-vacancy-link-props.types";

export function ViewVacancyLink({ application, className }: ViewVacancyLinkProps) {
  return (
    <Link
      href={getApplicationVacancyPath(application.jobOfferId)}
      aria-label={`${APPLICATION_MESSAGES.viewVacancy}: ${application.vacancyTitle}`}
      className={buttonVariants({ variant: "ghost", size: "sm", className: cn("text-accent hover:text-accent", className) })}
    >
      {APPLICATION_MESSAGES.viewVacancy}
    </Link>
  );
}
