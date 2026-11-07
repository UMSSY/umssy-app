"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APPLICATION_MESSAGES } from "../constants/application.constants";
import type { ApplicationStatusFilter } from "../types/application-list.types";
import type { ApplicationsStatusTabsProps } from "../types/applications-table-props.types";
import { getStatusTabs } from "../utils/get-status-tabs";

export function ApplicationsStatusTabs({ value, onValueChange, showWithdrawn = true }: ApplicationsStatusTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onValueChange(next as ApplicationStatusFilter)}
      className="max-w-full"
    >
      <TabsList aria-label={APPLICATION_MESSAGES.statusTabsLabel} className="max-w-full overflow-x-auto">
        {getStatusTabs(showWithdrawn).map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
