import type { APPLICATION_STATUS_CODES } from './state-changed.constants.js';

export type ApplicationStatusCode = (typeof APPLICATION_STATUS_CODES)[number];
