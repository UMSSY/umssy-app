import type { WorkPeriodResponse } from '../../work-experience/responses/work-period.response.js';

export type WorkPeriod = Pick<WorkPeriodResponse, 'startDate' | 'endDate'>;
