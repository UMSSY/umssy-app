'use client';

import { UserRoundPen } from "lucide-react";
import { useProfileGuide } from '../contexts/profile-guide-context';
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

interface ProfileCompletionBannerProps {
  hasContactInfo?: boolean;
}

export function ProfileCompletionBanner({ hasContactInfo = false }: ProfileCompletionBannerProps) {
  const guide = useProfileGuide();
  if (guide?.isEnabled) return null;
  return (
    <div
      role="status"
      className="flex flex-col items-start gap-4 rounded-lg border border-notice-border bg-notice px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5 sm:py-4"
    >
      <div className="flex items-center gap-3">
        <UserRoundPen aria-hidden="true" className="size-5 shrink-0 text-notice-foreground" />
        <p className="text-base text-notice-foreground">
          Completa tu perfil para que la comunidad te conozca.
        </p>
      </div>
      <Link
        href={hasContactInfo ? "/profile/settings#presentation" : "/profile/settings#personal-info"}
        className={cn(buttonVariants(), "h-10 bg-primary px-4 text-sm text-primary-foreground hover:bg-brand-hover", "w-full shrink-0 px-5 text-center sm:w-auto")}
      >
        Completar perfil
      </Link>
    </div>
  );
}
