import { APP_NAME, APP_VERSION } from "@/shared/constants/app.constants";

interface SidebarBrandProps {
  role?: string;
}

export function SidebarBrand({ role }: SidebarBrandProps) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent">
        <span className="text-sm font-bold leading-none text-surface">{APP_NAME[0]}</span>
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold text-surface">{APP_NAME}</p>
        <p className="text-[11px] text-surface/50">
          {role ? `${role} · ${APP_VERSION}` : APP_VERSION}
        </p>
      </div>
    </div>
  );
}
