export const NLP_PROCESSING_STATUSES = {
  pending: 'pending',
  ready: 'ready',
  error: 'error',
} as const;

export const NLP_LOG_EVENTS = {
  started: 'nlp.analysis.started',
  finished: 'nlp.analysis.finished',
  stale: 'nlp.analysis.stale',
  failed: 'nlp.analysis.failed',
  triggerFailed: 'nlp.analysis.trigger_failed',
} as const;
