import { REGISTRATION_STATUS_TITLES } from '../../../common/constants/registration-status.constants.js';

export const MAX_PAGE_SIZE = 50;
export const MAX_SEARCH_LENGTH = 50;
export const PUBLISHED_STATUS_TITLE = 'Publicado';
export const VOTING_STATUS_TITLE = 'Votacion';
export const VOTING_STATUS_TITLES = [VOTING_STATUS_TITLE, 'En votación'];
export const EXPIRED_STATUS_TITLE = 'Vencido';
export const COMMUNITY_ORIGIN_TITLE = 'Comunidad';
export const CONFIRMED_REGISTRATION_TITLE = REGISTRATION_STATUS_TITLES.confirmed;

export const CATALOG_STATUS_TITLES = [
  PUBLISHED_STATUS_TITLE,
  ...VOTING_STATUS_TITLES,
  EXPIRED_STATUS_TITLE,
];