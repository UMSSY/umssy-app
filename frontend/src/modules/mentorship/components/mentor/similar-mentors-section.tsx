import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { getInitials } from '@/shared/utils/get-initials';
import { SIMILAR_MENTORS_FIXTURE } from '../../testing/similar-mentors.fixture';

export function SimilarMentorsSection() {
  return (
    <section
      aria-labelledby="similar-mentors-title"
      className="@container mt-8 w-full min-w-0"
    >
      <h2 id="similar-mentors-title" className="text-xl font-bold text-ink">
        También podría interesarte
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-5 @min-[60rem]:grid-cols-3">
        {SIMILAR_MENTORS_FIXTURE.slice(0, 3).map((mentor) => (
          <Card
            key={mentor.id}
            aria-labelledby={`similar-${mentor.id}`}
            className="h-full min-w-0 border-border bg-surface shadow-none"
          >
            <CardContent className="flex flex-1 flex-col gap-5">
              <div className="flex min-w-0 items-start gap-4">
                <Avatar className="size-14 shrink-0">
                  <AvatarFallback>
                    {getInitials(mentor.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3
                    id={`similar-${mentor.id}`}
                    className="text-lg font-semibold [overflow-wrap:anywhere] text-ink"
                  >
                    {mentor.fullName}
                  </h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    {mentor.roleLabel}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="h-auto max-w-full border-border bg-surface-soft px-2.5 py-1 [overflow-wrap:anywhere] whitespace-normal text-ink"
              >
                <span
                  aria-hidden="true"
                  className={`size-1.5 shrink-0 rounded-full ${mentor.isAvailable ? 'bg-accent' : 'bg-text-secondary'}`}
                />
                {mentor.isAvailable
                  ? 'Disponible para mentoría'
                  : 'No disponible'}
              </Badge>
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">
                  Áreas técnicas
                </p>
                <ul className="flex flex-wrap gap-2">
                  {mentor.technicalAreas.map((area) => (
                    <li key={area} className="max-w-full min-w-0">
                      <Badge
                        variant="outline"
                        className="h-auto max-w-full border-accent/15 bg-interaction px-2.5 py-1 [overflow-wrap:anywhere] whitespace-normal text-accent"
                      >
                        {area}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">
                  Tipos de orientación
                </p>
                <ul className="flex flex-wrap gap-2">
                  {mentor.orientationTypes.map((orientation) => (
                    <li key={orientation} className="max-w-full min-w-0">
                      <Badge
                        variant="outline"
                        className="h-auto max-w-full border-border bg-surface-soft px-2.5 py-1 [overflow-wrap:anywhere] whitespace-normal text-ink-soft"
                      >
                        {orientation}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <CardFooter className="mt-auto bg-surface">
              {/* Profile navigation is intentionally deferred to Task-10f. */}
              <Button
                type="button"
                variant="outline"
                disabled
                className="min-h-11 w-full border-border-strong text-ink"
                aria-label={`Ver perfil de ${mentor.fullName}`}
              >
                Ver perfil
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
