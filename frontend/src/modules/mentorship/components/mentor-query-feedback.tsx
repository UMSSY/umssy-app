"use client";

import Link from "next/link";
import { AlertCircle, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

interface MentorQueryFeedbackProps {
  title: string;
  description: string;
  onRetry?: () => void;
  showDirectoryLink?: boolean;
}

export function MentorQueryFeedback({
  title, description, onRetry, showDirectoryLink = false,
}: MentorQueryFeedbackProps) {
  const Icon = onRetry ? AlertCircle : Users;
  return (
    <section role={onRetry ? "alert" : "status"} className="rounded-xl border border-border bg-surface p-6 text-center sm:p-10">
      <Icon aria-hidden="true" className="mx-auto mb-4 size-8 text-text-secondary" />
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-text-secondary">{description}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {onRetry && <button type="button" onClick={onRetry} className={buttonVariants({ variant: "outline" })}>Reintentar</button>}
        {showDirectoryLink && <Link href="/mentorship/mentors" className={buttonVariants({ variant: "outline" })}>Volver al directorio</Link>}
      </div>
    </section>
  );
}

