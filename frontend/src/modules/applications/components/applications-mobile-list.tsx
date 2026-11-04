import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { APPLICATION_MESSAGES, WITHDRAWABLE_STATUSES } from "../constants/application.constants";
import type { ApplicationsTableProps } from "../types/applications-table-props.types";

type MobileFilterStatus = "TODAS" | "EN_REVISION" | "ENTREVISTA";

export function ApplicationsMobileList({ applications, withdrawingId, onWithdraw }: ApplicationsTableProps) {
  const [activeFilter, setActiveFilter] = useState<MobileFilterStatus>("TODAS");

  const filteredApplications = useMemo(() => {
    switch (activeFilter) {
      case "EN_REVISION":
        return applications.filter((app) => app.status === "En revisión");
      case "ENTREVISTA":
        return applications.filter((app) => app.status === "Entrevista");
      default:
        return applications;
    }
  }, [applications, activeFilter]);

  return (
    <div className="block space-y-4 md:hidden">
      {}
      <div className="flex rounded-lg border border-border bg-surface p-1">
        <Button
          type="button"
          onClick={() => setActiveFilter("TODAS")}
          className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${
            activeFilter === "TODAS"
              ? "bg-primary font-semibold text-primary-foreground shadow-sm"
              : "text-text-secondary hover:text-ink"
          }`}
        >
          Todas
        </Button>
        <Button
          type="button"
          onClick={() => setActiveFilter("EN_REVISION")}
          className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${
            activeFilter === "EN_REVISION"
              ? "bg-primary font-semibold text-primary-foreground shadow-sm"
              : "text-text-secondary hover:text-ink"
          }`}
        >
          En revisión
        </Button>
        <Button
          type="button"
          onClick={() => setActiveFilter("ENTREVISTA")}
          className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${
            activeFilter === "ENTREVISTA"
              ? "bg-primary font-semibold text-primary-foreground shadow-sm"
              : "text-text-secondary hover:text-ink"
          }`}
        >
          Entrevista
        </Button>
      </div>

      {}
      {filteredApplications.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-center text-sm text-text-secondary">
          No hay postulaciones registradas en este estado.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApplications.map((application) => (
            <div
              key={application.id}
              className="space-y-3 rounded-lg border border-border bg-surface p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-ink">{application.vacancyTitle}</h3>
                  <p className="text-xs text-text-secondary">{application.companyName}</p>
                </div>
                <Badge variant="outline">{application.status}</Badge>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-2">
                <div className="text-xs text-text-secondary">
                  <span className="font-medium text-ink">{APPLICATION_MESSAGES.affinity}:</span>{" "}
                  {application.affinityPercentage}%
                </div>

                <div>
                  {WITHDRAWABLE_STATUSES.includes(application.status) ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={withdrawingId === application.id}
                      onClick={() => onWithdraw(application.id)}
                    >
                      {withdrawingId === application.id
                        ? APPLICATION_MESSAGES.withdrawing
                        : APPLICATION_MESSAGES.withdraw}
                    </Button>
                  ) : (
                    <span className="text-xs text-text-secondary">
                      {APPLICATION_MESSAGES.notAvailable}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}