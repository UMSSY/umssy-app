"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APPLICATION_MESSAGES, APPLICATION_STATUS_TABS } from "../constants/application.constants";
import type { ApplicationStatusFilter } from "../types/application-list.types";
import type { ApplicationsStatusTabsProps } from "../types/applications-table-props.types";

export function ApplicationsStatusTabs({ value, onValueChange }: ApplicationsStatusTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onValueChange(next as ApplicationStatusFilter)}
      className="max-w-full"
    >
      <TabsList aria-label={APPLICATION_MESSAGES.statusTabsLabel} className="max-w-full overflow-x-auto">
        {APPLICATION_STATUS_TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
