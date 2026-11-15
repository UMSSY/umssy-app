'use client';

import { Circle, CircleCheck } from 'lucide-react';
import { useId } from 'react';
import Link from 'next/link';
import {
  PROFILE_COMPLETENESS_HASH_PREFIX,
  PROFILE_COMPLETENESS_ROUTES,
} from '../constants/profile-completeness-navigation.constants';
import {
  PROFILE_COMPLETENESS_MESSAGES,
  PROFILE_COMPLETENESS_SECTION_IDS,
  PROFILE_COMPLETENESS_SECTION_LABELS,
} from '../constants/profile-completeness.constants';
import type { ProfileCompletenessChecklistProps } from '../types/profile-completeness-checklist-props.types';

export function ProfileCompletenessChecklist({
  sections = [],
}: ProfileCompletenessChecklistProps) {
  const titleId = useId();
  const sectionsById = new Map(
    (sections ?? []).map((section) => [section.id, section]),
  );
  const hasAllSections = PROFILE_COMPLETENESS_SECTION_IDS.every((id) =>
    sectionsById.has(id),
  );
  const completedCount = PROFILE_COMPLETENESS_SECTION_IDS.filter(
    (id) => sectionsById.get(id)?.isCompleted,
  ).length;

  return (
    <section
      aria-labelledby={titleId}
      className="mx-4 border-t border-border py-4 text-foreground sm:mx-5 sm:py-5"
    >
      <h3 id={titleId} className="sr-only">
        {PROFILE_COMPLETENESS_MESSAGES.checklistTitle}
      </h3>
      {hasAllSections ? (
        <p className="mb-3 text-xs font-semibold text-app-header">
          {PROFILE_COMPLETENESS_MESSAGES.sectionCount
            .replace('{completed}', String(completedCount))
            .replace(
              '{total}',
              String(PROFILE_COMPLETENESS_SECTION_IDS.length),
            )}
        </p>
      ) : null}
      {hasAllSections ? (
        <ul className="grid grid-cols-1 gap-2 @sm:grid-cols-2 @lg:grid-cols-4">
          {PROFILE_COMPLETENESS_SECTION_IDS.map((id) => {
            const section = sectionsById.get(id);
            if (!section) return null;
            const Icon = section.isCompleted ? CircleCheck : Circle;

            const content = (
              <>
                <Icon
                  aria-hidden="true"
                  className={
                    section.isCompleted
                      ? 'mt-0.5 size-3.5 shrink-0 fill-app-header text-surface'
                      : 'mt-0.5 size-3.5 shrink-0 text-text-secondary'
                  }
                />
                <span className="min-w-0 space-y-1">
                  <span className="block text-xs leading-snug font-medium">
                    {PROFILE_COMPLETENESS_SECTION_LABELS[id]}
                  </span>
                  <span className="block text-xs text-text-secondary">
                    {section.isCompleted
                      ? PROFILE_COMPLETENESS_MESSAGES.completed
                      : PROFILE_COMPLETENESS_MESSAGES.pending}
                  </span>
                </span>
              </>
            );

            return (
              <li
                key={id}
                aria-label={`${PROFILE_COMPLETENESS_SECTION_LABELS[id]}: ${section.isCompleted ? PROFILE_COMPLETENESS_MESSAGES.completed : PROFILE_COMPLETENESS_MESSAGES.pending}`}
                className="min-w-0"
              >
                {section.isCompleted ? (
                  <div className="flex h-full min-h-16 items-start gap-2 rounded-md border border-border bg-surface p-2">
                    {content}
                  </div>
                ) : (
                  <Link
                    href={`${PROFILE_COMPLETENESS_ROUTES[id]}${PROFILE_COMPLETENESS_HASH_PREFIX}${id}`}
                    scroll={false}
                    onClick={(event) => {
                      if (
                        event.button !== 0 ||
                        event.metaKey ||
                        event.ctrlKey ||
                        event.shiftKey ||
                        event.altKey ||
                        window.location.pathname !==
                          PROFILE_COMPLETENESS_ROUTES[id]
                      )
                        return;

                      // Next's same-page pushState does not emit hashchange.
                      event.preventDefault();
                      const hash = `${PROFILE_COMPLETENESS_HASH_PREFIX}${id}`;
                      if (window.location.hash === hash) {
                        window.dispatchEvent(new HashChangeEvent('hashchange'));
                      } else {
                        window.location.hash = hash;
                      }
                    }}
                    aria-label={`Completar ${PROFILE_COMPLETENESS_SECTION_LABELS[id]}`}
                    className="flex h-full min-h-16 items-start gap-2 rounded-md border border-border bg-surface p-2 hover:border-app-header hover:bg-interaction focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-header"
                  >
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-text-secondary">
          {PROFILE_COMPLETENESS_MESSAGES.unavailableSections}
        </p>
      )}
    </section>
  );
}
