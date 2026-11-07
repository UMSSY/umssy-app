import { APPLICATION_STATUS_TABS, WITHDRAWN_STATUS } from "../constants/application.constants";

export function getStatusTabs(showWithdrawn: boolean) {
  if (showWithdrawn) return APPLICATION_STATUS_TABS;
  return APPLICATION_STATUS_TABS.filter((tab) => tab.value !== WITHDRAWN_STATUS);
}
