import type { RequestAccessShellProps } from "../../types/request-access-shell-props.types";
import { RequestStepsSidebar } from "./request-steps-sidebar";

export function RequestAccessShell({
  currentStep,
  header,
  children,
}: RequestAccessShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {header}

      <div className="flex flex-1 flex-col lg:flex-row">
        <RequestStepsSidebar currentStep={currentStep} />

        <section className="flex min-w-0 flex-1 flex-col px-4 py-6 md:p-8">
          <div className="mx-auto flex w-full max-w-5xl justify-center">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
