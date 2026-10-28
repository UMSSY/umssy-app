import type { NLP_PROCESSING_STATUSES } from '../constants/nlp-processing.constants.js';

export type NlpProcessingStatus = (typeof NLP_PROCESSING_STATUSES)[keyof typeof NLP_PROCESSING_STATUSES];
