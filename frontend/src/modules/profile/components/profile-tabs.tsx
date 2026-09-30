import type { ProfileTab } from "../types/profile.types";

interface TabItem {
  id: ProfileTab;
  label: string;
  shortLabel: string;
  isAvailable: boolean;
}

// Trajectory and documents belong to the next user stories of Epic 2.
const TABS: TabItem[] = [
  { id: "personal", label: "Datos personales", shortLabel: "Datos", isAvailable: true },
  { id: "presentation", label: "Presentación", shortLabel: "Presentación", isAvailable: true },
  { id: "trajectory", label: "Trayectoria", shortLabel: "Trayectoria", isAvailable: false },
  { id: "documents", label: "Documentos", shortLabel: "Documentos", isAvailable: false },
];

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onChange: (tab: ProfileTab) => void;
}

export function ProfileTabs({ activeTab, onChange }: ProfileTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Secciones del perfil"
      className="mb-6 flex justify-between gap-4 overflow-x-auto border-b border-border scrollbar-none sm:justify-start sm:gap-10"
    >
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-label={tab.label}
            aria-selected={isActive}
            disabled={!tab.isAvailable}
            title={tab.isAvailable ? undefined : "Disponible próximamente"}
            onClick={() => onChange(tab.id)}
            className={`shrink-0 whitespace-nowrap pb-3 text-[14px] transition-colors disabled:cursor-not-allowed md:text-[15px] ${
              isActive
                ? "font-semibold text-accent shadow-[inset_0_-2px_0_0_var(--color-accent)]"
                : "text-text-secondary hover:text-ink"
            }`}
          >
            <span className="sm:hidden">{tab.shortLabel}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
