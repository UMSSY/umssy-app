"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { WorkspacePage } from "@/shared/components/layout";
import { useAuth } from "@/shared/contexts/auth-context";
import { AppointmentCard } from "../components/appointment-card";
import {
  APPOINTMENTS_EYEBROW,
  APPOINTMENTS_TEXT,
} from "../constants/appointments.constants";
import { useAppointments } from "../hooks/use-appointments";
import type { AppointmentScope } from "../types/appointment-scope.types";

export function AppointmentsView() {
  const [scope, setScope] = useState<AppointmentScope>("upcoming");
  const { roles } = useAuth();
  const { appointments, isLoading, error } = useAppointments(scope);

  const emptyMessage =
    scope === "upcoming"
      ? APPOINTMENTS_TEXT.emptyState
      : APPOINTMENTS_TEXT.emptyPast;

  const showSearchMentors =
    scope === "upcoming" && roles.includes("titulado");

  function handleScopeChange(value: unknown) {
    if (value === "upcoming" || value === "past") {
      setScope(value);
    }
  }

  return (
    <WorkspacePage
      title={APPOINTMENTS_TEXT.title}
      description={APPOINTMENTS_EYEBROW}
      className="min-w-0"
    >
      <Tabs
        value={scope}
        onValueChange={handleScopeChange}
        className="min-w-0"
      >
        <TabsList
          aria-label={APPOINTMENTS_TEXT.tabsLabel}
          className="w-full sm:w-fit"
        >
          <TabsTrigger value="upcoming">
            {APPOINTMENTS_TEXT.upcoming}
          </TabsTrigger>
          <TabsTrigger value="past">
            {APPOINTMENTS_TEXT.past}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value={scope}
          className="min-w-0 pt-4"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <div
              role="status"
              aria-label={APPOINTMENTS_TEXT.loading}
              className="space-y-3"
            >
              {[0, 1, 2].map((index) => (
                <Skeleton
                  key={index}
                  aria-hidden="true"
                  className="h-40 w-full rounded-lg"
                />
              ))}
              <span className="sr-only">
                {APPOINTMENTS_TEXT.loading}
              </span>
            </div>
          ) : error ? (
            <p role="alert" className="text-center text-destructive">
              {error}
            </p>
          ) : appointments.length === 0 ? (
            <div className="space-y-3 rounded-lg border border-dashed border-border p-4 text-center">
              <p
                role="status"
                className="text-sm text-muted-foreground"
              >
                {emptyMessage}
              </p>

              {showSearchMentors && (
                <Link
                  href="/mentorship/mentors"
                  className={buttonVariants()}
                >
                  {APPOINTMENTS_TEXT.searchMentors}
                </Link>
              )}
            </div>
          ) : (
            <ul className="grid min-w-0 grid-cols-1 gap-4">
              {appointments.map((appointment) => (
                <li key={appointment.id} className="min-w-0">
                  <AppointmentCard appointment={appointment} />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </WorkspacePage>
  );
}
